<?php

declare(strict_types=1);

namespace App\Http\Controllers\Mcp;

use App\Http\Controllers\Controller;
use App\Mcp\ConnectorName;
use App\Mcp\McpbBuilder;
use App\Mcp\McpVersion;
use App\Mcp\ToolRegistry;
use App\Models\ActivityLog;
use App\Models\ApiKey;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

/**
 * Settings → MCP Server: keys, connection name, and the bundle download.
 *
 * Super-admin only, matching the other credential-issuing screens. The keys
 * listed here are the ones minted for MCP; keys for the older email-delivery
 * endpoints are left alone.
 */
final class McpSettingsController extends Controller
{
    public function __construct(
        private readonly McpbBuilder $builder,
        private readonly ToolRegistry $registry,
    ) {
    }

    public function index(Request $request)
    {
        $user = $request->user();

        // Super admins run the connection; admins just need a key and a file.
        // Two screens rather than one screen with half of it hidden, because
        // the admin flow is genuinely a different, shorter task.
        $isSuperAdmin = $user->isSuperAdmin();

        $tools = [];
        foreach ($this->registry->visibleTo($user) as $tool) {
            $tools[] = [
                'name'        => $tool->name(),
                'description' => $tool->description(),
                'role'        => $tool->role(),
                'read_only'   => $tool->readOnly(),
            ];
        }

        $appUrl = (string) config('app.url');

        return Inertia::render($isSuperAdmin ? 'Admin/Settings/Mcp' : 'Admin/Settings/McpSelf', [
            'connector' => [
                'name'         => ConnectorName::get(),
                'stored'       => ConnectorName::stored(),
                'display_name' => ConnectorName::displayName(),
                'default'      => ConnectorName::defaultName(),
                'filename'     => $this->builder->filename(),
            ],
            'endpoint' => $this->builder->endpoint(),
            'version'  => McpVersion::current(),
            // A bundle is only as good as the URL baked into it, and this is
            // the setting a fresh deployment most often leaves wrong.
            'app_url_warning' => (str_contains($appUrl, 'localhost') || str_contains($appUrl, '127.0.0.1'))
                ? "APP_URL is set to {$appUrl}. Bundles generated now will only work on the server itself — set APP_URL to the public address first."
                : null,
            'tools' => $tools,
            'is_super_admin' => $isSuperAdmin,
            // An admin sees only their own keys: someone else's key is not
            // theirs to revoke, and listing it tells them who else is
            // connected, which is not their business either.
            'keys'  => ApiKey::query()
                ->with('user')
                ->whereJsonContains('permissions', 'mcp.use')
                ->when(!$isSuperAdmin, fn ($q) => $q->where('user_id', $user->id))
                ->orderByDesc('created_at')
                ->get()
                ->map(fn (ApiKey $k) => [
                    'id'           => $k->id,
                    'name'         => $k->name,
                    'owner'        => $k->user?->name,
                    'owner_email'  => $k->user?->email,
                    'owner_role'   => $k->user?->role,
                    'is_active'    => $k->is_active,
                    'expires_at'   => $k->expires_at?->format('Y-m-d'),
                    'last_used_at' => $k->last_used_at?->diffForHumans(),
                    'created_at'   => $k->created_at?->format('Y-m-d'),
                ]),
        ]);
    }

    public function updateConnector(Request $request)
    {
        $validated = $request->validate([
            'connector_name' => ['nullable', 'string', 'max:120'],
        ]);

        // Sanitised rather than rejected: somebody typing "AISG Leave (stg)"
        // should get a working key back, and the screen shows them what it
        // became. Blank clears the override and restores the derived default.
        $name = ConnectorName::sanitize($validated['connector_name'] ?? '');

        SystemSetting::set(ConnectorName::SETTING, $name);

        ActivityLog::log('settings.mcp_connector_renamed', null, ['connector_name' => $name]);

        return back()->with('success', $name === ''
            ? 'Connection name reset to the default.'
            : "Connection name set to {$name}.");
    }

    public function generateKey(Request $request)
    {
        $validated = $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'expires_in' => ['nullable', 'integer', 'min:1', 'max:730'],
        ]);

        $plain = ApiKey::generateKey();

        ApiKey::create([
            // Bound to the admin who pressed the button: the key acts as them,
            // and inherits exactly their permissions.
            'user_id'     => $request->user()->id,
            'name'        => $validated['name'],
            'key'         => $plain,
            'permissions' => ['mcp.use'],
            'is_active'   => true,
            'expires_at'  => !empty($validated['expires_in'])
                ? now()->addDays((int) $validated['expires_in'])
                : null,
        ]);

        ActivityLog::log('settings.mcp_key_created', null, ['key_name' => $validated['name']]);

        // Shown once. The column is hidden on the model and there is no
        // read-back route, so a lost key is regenerated, not recovered.
        return back()->with('mcp_key', $plain);
    }

    public function revokeKey(Request $request, ApiKey $apiKey)
    {
        if (!$apiKey->hasPermission('mcp.use')) {
            return back()->with('error', 'That key does not belong to the MCP server.');
        }

        if (!$request->user()->isSuperAdmin() && $apiKey->user_id !== $request->user()->id) {
            abort(403, 'You can only revoke your own MCP keys.');
        }

        $apiKey->delete();

        ActivityLog::log('settings.mcp_key_revoked', null, ['key_name' => $apiKey->name]);

        return back()->with('success', "Key \"{$apiKey->name}\" revoked. Any client using it stops working immediately.");
    }

    /**
     * Download the bundle, optionally with an API key baked in.
     *
     * Baking is opt-in per download rather than a setting: the safe bundle
     * stays the default, and every credential-bearing file is the result of a
     * deliberate click that gets its own audit entry.
     */
    public function downloadBundle(Request $request): BinaryFileResponse
    {
        $bakedKey = null;

        if ($keyId = $request->query('key')) {
            $bakedKey = ApiKey::with('user')->find($keyId);

            if (!$bakedKey || !$bakedKey->hasPermission('mcp.use')) {
                abort(404, 'That MCP key does not exist.');
            }

            // Baking someone else's key into a file you download would hand you
            // their access, so an admin may only bake their own.
            if (!$request->user()->isSuperAdmin() && $bakedKey->user_id !== $request->user()->id) {
                abort(403, 'You can only download a bundle containing your own key.');
            }

            // Baking a key that is already dead produces a bundle that cannot
            // work, and the person would not find out until they installed it.
            if (!$bakedKey->isValid()) {
                abort(422, 'That key is revoked or expired. Generate a new one first.');
            }
        }

        try {
            $path = $this->builder->build($request->user(), $bakedKey);
        } catch (Throwable $e) {
            abort(500, 'Could not build the MCP bundle: ' . $e->getMessage());
        }

        ActivityLog::log('settings.mcp_bundle_downloaded', null, [
            'connector'  => ConnectorName::get(),
            'version'    => McpVersion::current(),
            // Recorded because a downloaded credential is a thing you may need
            // to account for later.
            'baked_key'  => $bakedKey?->name,
            'key_id'     => $bakedKey?->id,
        ]);

        return response()->download($path, $this->builder->filename($bakedKey), [
            'Content-Type' => 'application/zip',
        ])->deleteFileAfterSend((bool) $bakedKey);
    }
}
