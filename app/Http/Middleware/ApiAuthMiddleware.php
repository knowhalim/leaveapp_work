<?php

namespace App\Http\Middleware;

use App\Models\ApiKey;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Accepts either:
 *   • X-API-Key: <key>  header (or ?api_key= query param)  → ApiKey model auth
 *   • Authorization: Bearer <token>                         → Sanctum token auth
 *
 * An optional permission string may be passed via middleware parameter:
 *   middleware('api.auth:reports.generate')
 *
 * If no permission is given, any valid key is accepted.
 * Sanctum token holders always bypass the permission check (role middleware handles theirs).
 */
class ApiAuthMiddleware
{
    public function handle(Request $request, Closure $next, ?string $permission = null): Response
    {
        $rawKey = $request->header('X-API-Key') ?? $request->query('api_key');

        // ── API Key path ────────────────────────────────────────────────────
        if ($rawKey) {
            $apiKey = ApiKey::where('key', $rawKey)->first();

            if (!$apiKey || !$apiKey->isValid()) {
                return response()->json([
                    'error' => 'Invalid or expired API key.',
                ], 401);
            }

            if ($permission && !$apiKey->hasPermission($permission)) {
                return response()->json([
                    'error'               => "This API key does not have the '{$permission}' permission.",
                    'key_permissions'     => $apiKey->permissions ?? ['all'],
                    'required_permission' => $permission,
                ], 403);
            }

            $apiKey->updateQuietly(['last_used_at' => now()]);
            $request->attributes->set('api_key', $apiKey);

            return $next($request);
        }

        // ── Sanctum Bearer path ─────────────────────────────────────────────
        $user = $request->user('sanctum');

        if (!$user) {
            return response()->json([
                'error' => 'Authentication required. Provide an X-API-Key header or a Bearer token.',
            ], 401);
        }

        return $next($request);
    }
}
