<?php

declare(strict_types=1);

namespace App\Mcp;

use App\Mcp\Contracts\McpTool;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * JSON-RPC 2.0 dispatch for the MCP server.
 *
 * The whole protocol lives in PHP, and the Node stub inside the .mcpb bundle
 * is a dumb pipe between the client's stdio and this class. That is deliberate:
 * tool definitions, permissions and results then have exactly one
 * implementation, and adding a tool never means shipping a new bundle to
 * everyone who installed the old one.
 *
 * Version negotiation spans two eras of the spec. Revisions up to 2025-11-25
 * agree a version during `initialize`; 2026-07-28 carries it per-request and
 * adds `server/discover`. Both are answered, because a bundle installed today
 * will meet clients of both kinds.
 */
final class McpProtocol
{
    /**
     * Protocol revisions this server will speak, newest first.
     *
     * The client's choice wins when it is on this list; otherwise it is told
     * what is on offer rather than being handed a version it did not ask for.
     */
    public const SUPPORTED_VERSIONS = [
        '2026-07-28',
        '2025-11-25',
        '2025-06-18',
        '2025-03-26',
    ];

    public const PREFERRED_VERSION = '2026-07-28';

    // JSON-RPC 2.0 reserved codes.
    private const PARSE_ERROR      = -32700;
    private const INVALID_REQUEST  = -32600;
    private const METHOD_NOT_FOUND = -32601;
    private const INVALID_PARAMS   = -32602;
    private const INTERNAL_ERROR   = -32603;

    public function __construct(private readonly ToolRegistry $registry)
    {
    }

    /**
     * Handle one JSON-RPC message (single or batch) for an authenticated user.
     *
     * Returns null when nothing should be sent back — a notification, or a
     * batch consisting only of notifications, per JSON-RPC 2.0.
     */
    public function handle(mixed $message, User $user): ?array
    {
        if (is_array($message) && array_is_list($message)) {
            if ($message === []) {
                return $this->error(null, self::INVALID_REQUEST, 'Batch must not be empty.');
            }

            $responses = [];
            foreach ($message as $one) {
                $response = $this->handleOne($one, $user);
                if ($response !== null) {
                    $responses[] = $response;
                }
            }

            return $responses === [] ? null : $responses;
        }

        return $this->handleOne($message, $user);
    }

    private function handleOne(mixed $request, User $user): ?array
    {
        if (!is_array($request) || !isset($request['method']) || !is_string($request['method'])) {
            return $this->error(null, self::INVALID_REQUEST, 'Not a valid JSON-RPC 2.0 request object.');
        }

        $id     = $request['id'] ?? null;
        $method = $request['method'];
        $params = is_array($request['params'] ?? null) ? $request['params'] : [];

        // No id means a notification: act on it, answer nothing. Returning an
        // error here would put an unsolicited message on a client's stdin.
        $isNotification = !array_key_exists('id', $request);

        try {
            $result = match ($method) {
                'initialize'      => $this->initialize($params),
                'server/discover' => $this->discover(),
                'tools/list'      => ['tools' => $this->registry->describeFor($user)],
                'tools/call'      => $this->callTool($params, $user),
                'ping'            => new \stdClass(),
                default           => null,
            };

            if ($result === null) {
                // Notifications the spec defines but this server has no work
                // for (notifications/initialized, cancellations) are accepted
                // silently; an unknown *request* still gets a proper error.
                if ($isNotification) {
                    return null;
                }

                return $this->error($id, self::METHOD_NOT_FOUND, "Unknown method: {$method}");
            }

            return $isNotification ? null : [
                'jsonrpc' => '2.0',
                'id'      => $id,
                'result'  => $result,
            ];
        } catch (McpToolException $e) {
            return $isNotification ? null : $this->error($id, $e->getCode() ?: self::INVALID_PARAMS, $e->getMessage());
        } catch (Throwable $e) {
            // The client is an AI agent that will relay whatever it is told, so
            // the internal message stays in the log and the wire gets a
            // reference instead of a stack trace.
            $reference = substr(bin2hex(random_bytes(6)), 0, 12);

            Log::error('MCP request failed', [
                'reference' => $reference,
                'method'    => $method,
                'user_id'   => $user->id,
                'exception' => $e,
            ]);

            return $isNotification ? null : $this->error(
                $id,
                self::INTERNAL_ERROR,
                "The server failed to handle this request. Reference: {$reference}"
            );
        }
    }

    private function initialize(array $params): array
    {
        $requested = is_string($params['protocolVersion'] ?? null) ? $params['protocolVersion'] : null;

        return [
            'protocolVersion' => in_array($requested, self::SUPPORTED_VERSIONS, true)
                ? $requested
                : self::PREFERRED_VERSION,
            'capabilities'    => [
                'tools' => ['listChanged' => false],
            ],
            'serverInfo'      => $this->serverInfo(),
            'instructions'    => 'Reporting tools for the HR leave system. '
                . 'Resolve department and leave type names to ids with list_departments and list_leave_types before calling a report. '
                . 'Report results carry a "truncated" flag: when it is true you are seeing a page of rows, but the totals alongside cover the full set.',
        ];
    }

    /**
     * `server/discover` — the 2026-07-28 way to ask what a server is before talking to it.
     */
    private function discover(): array
    {
        return [
            'protocolVersions' => self::SUPPORTED_VERSIONS,
            'capabilities'     => [
                'tools' => ['listChanged' => false],
            ],
            'serverInfo'       => $this->serverInfo(),
        ];
    }

    /**
     * Server identity, shared by `initialize` and `server/discover`.
     *
     * One method rather than two literals: a client may call either, and the
     * two answers disagreeing about what this server is called is the kind of
     * bug nobody finds until a connector shows the wrong name.
     */
    private function serverInfo(): array
    {
        return [
            'name'    => 'aiapleave',
            'title'   => SystemSetting::getCompanyName(),
            'version' => McpVersion::current(),
        ];
    }

    private function callTool(array $params, User $user): array
    {
        $name = $params['name'] ?? null;

        if (!is_string($name) || $name === '') {
            throw new McpToolException('A tool name is required.', self::INVALID_PARAMS);
        }

        $tool = $this->registry->find($name);

        if (!$tool instanceof McpTool) {
            throw new McpToolException("Unknown tool: {$name}", self::METHOD_NOT_FOUND);
        }

        // Checked here rather than in each tool, and phrased without naming
        // what the tool would have done — a refusal is not a place to describe
        // the capability being refused.
        if (!ToolRegistry::satisfies($user, $tool->role())) {
            throw new McpToolException(
                "Your account does not have permission to use the '{$name}' tool.",
                self::INVALID_PARAMS
            );
        }

        $arguments = is_array($params['arguments'] ?? null) ? $params['arguments'] : [];

        $data = $tool->handle($arguments, $user);

        return [
            // Text content keeps every client working; structuredContent is
            // what a client that understands it should actually read.
            'content' => [[
                'type' => 'text',
                'text' => json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            ]],
            'structuredContent' => $data,
            'isError'           => false,
        ];
    }

    private function error(mixed $id, int $code, string $message): array
    {
        return [
            'jsonrpc' => '2.0',
            'id'      => $id,
            'error'   => [
                'code'    => $code,
                'message' => $message,
            ],
        ];
    }
}
