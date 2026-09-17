<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\ApiKey;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authenticates the MCP transport and resolves the acting user.
 *
 * Stricter than {@see ApiAuthMiddleware} on purpose. That middleware serves
 * endpoints whose output is emailed to a named person, so a key without an
 * identity was tolerable. MCP returns report rows in the response body, which
 * means whoever holds the key reads the data — so the key must *be* somebody,
 * and that somebody must be an admin.
 *
 * Three ways in, all resolving to a User:
 *   • X-API-Key belonging to an admin (how a .mcpb bundle connects)
 *   • Sanctum bearer token (how a logged-in admin's tooling connects)
 *   • an active web session (how the admin UI's "test connection" works)
 */
final class McpAuthMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $this->resolveUser($request);

        if (!$user instanceof User) {
            return $this->deny('Authentication required. Provide an X-API-Key header or a Bearer token.', 401);
        }

        if (!$user->is_active) {
            return $this->deny('This account is deactivated.', 403);
        }

        if (!$user->isAdmin()) {
            return $this->deny('The MCP server is available to admin and super admin accounts only.', 403);
        }

        // Downstream reads the acting user from here, never from the payload.
        $request->setUserResolver(static fn () => $user);

        return $next($request);
    }

    private function resolveUser(Request $request): ?User
    {
        $rawKey = $request->header('X-API-Key');

        if (is_string($rawKey) && $rawKey !== '') {
            $apiKey = ApiKey::with('user')->where('key', $rawKey)->first();

            if (!$apiKey || !$apiKey->isValid()) {
                return null;
            }

            // A legacy key predating identity binding cannot be used here: we
            // have no way to know who it speaks for, and guessing is how data
            // reaches the wrong person.
            if (!$apiKey->user) {
                return null;
            }

            if (!$apiKey->hasPermission('mcp.use')) {
                return null;
            }

            $apiKey->updateQuietly(['last_used_at' => now()]);

            return $apiKey->user;
        }

        return $request->user('sanctum') ?? $request->user('web');
    }

    /**
     * Refuse in JSON-RPC's own vocabulary.
     *
     * The caller is an MCP client, not a browser: an HTML error page or a bare
     * Laravel JSON error leaves it with nothing to show the user. -32001 is in
     * the implementation-defined server range.
     */
    private function deny(string $message, int $status): Response
    {
        return response()->json([
            'jsonrpc' => '2.0',
            'id'      => null,
            'error'   => [
                'code'    => -32001,
                'message' => $message,
            ],
        ], $status);
    }
}
