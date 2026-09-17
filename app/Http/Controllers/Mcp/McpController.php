<?php

declare(strict_types=1);

namespace App\Http\Controllers\Mcp;

use App\Http\Controllers\Controller;
use App\Mcp\McpProtocol;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * The HTTP face of the MCP server.
 *
 * One endpoint, one job: hand the JSON-RPC body to {@see McpProtocol} and
 * return what comes back. Authentication and the admin check have already run
 * in {@see \App\Http\Middleware\McpAuthMiddleware}, so the acting user is
 * whoever the credential belongs to.
 */
final class McpController extends Controller
{
    public function __construct(private readonly McpProtocol $protocol)
    {
    }

    public function handle(Request $request): JsonResponse|Response
    {
        $payload = $request->json()->all();

        // A body that is not JSON at all arrives as an empty array, which is
        // indistinguishable from an empty batch — both are refused, but this
        // one needs the parse-error code the spec reserves for it.
        if ($payload === [] && $request->getContent() !== '[]') {
            return response()->json([
                'jsonrpc' => '2.0',
                'id'      => null,
                'error'   => ['code' => -32700, 'message' => 'Request body is not valid JSON.'],
            ], 400);
        }

        $response = $this->protocol->handle($payload, $request->user());

        // Notifications get 202 with no body: returning `null` as JSON would
        // be a malformed JSON-RPC response rather than the absence of one.
        if ($response === null) {
            return response()->noContent(202);
        }

        return response()->json($response);
    }
}
