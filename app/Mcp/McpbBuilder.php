<?php

declare(strict_types=1);

namespace App\Mcp;

use App\Models\ApiKey;
use App\Models\User;
use Illuminate\Support\Facades\File;
use RuntimeException;
use ZipArchive;

/**
 * Builds a one-click-installable MCP Bundle (.mcpb) for this deployment.
 *
 * Every bundle is *baked* for the install that generated it: the server URL,
 * the version and the connection name are written into the manifest, and the
 * tool table is generated from the tools actually registered, so a downloaded
 * bundle always describes the server it came from. Installing it asks one
 * question — the API key — and two deployments' bundles never collide in one
 * client.
 *
 * The bundle carries a local stdio server rather than declaring a remote one.
 * That is what the .mcpb format supports: `server.type` is node | python |
 * binary | uv, all of them local. A manifest claiming `"type": "remote"` is
 * not part of the spec and a compliant client will not install it. The stdio
 * server we ship is a thin pipe onto this app's /api/mcp endpoint, which gets
 * the same result — one connector, no infrastructure, tools defined in one
 * place — through a shape clients actually accept.
 *
 * @see https://github.com/modelcontextprotocol/mcpb/blob/main/MANIFEST.md
 */
final class McpbBuilder
{
    /**
     * Bundle-format version the manifest declares.
     *
     * The .mcpb schema, not this app's version: it tells the client how to
     * read the file. Current clients expect 0.3.
     */
    public const MANIFEST_VERSION = '0.3';

    public function __construct(private readonly ToolRegistry $registry)
    {
    }

    /**
     * Where built bundles live. Outside public/, because a bundle is handed
     * out by an authenticated download, not served to anyone who guesses it.
     */
    public function outputDirectory(): string
    {
        return storage_path('app/mcpb');
    }

    public function filename(?ApiKey $bakedKey = null): string
    {
        // A bundle carrying a live credential says so in its own name. These
        // files end up in Downloads folders and get forwarded; the one moment
        // somebody might notice is when they read the filename.
        $suffix = $bakedKey instanceof ApiKey ? '-with-key' : '';

        return ConnectorName::get() . $suffix . '.mcpb';
    }

    public function path(?ApiKey $bakedKey = null): string
    {
        return $this->outputDirectory() . '/' . $this->filename($bakedKey);
    }

    /**
     * The manifest, as an array.
     *
     * $user scopes the advertised tool list to what that admin can actually
     * call, so the bundle never promises a tool the key behind it is refused.
     */
    public function manifest(User $user, ?ApiKey $bakedKey = null): array
    {
        $plainKey = $bakedKey?->getAttributes()['key'] ?? null;

        return [
            'manifest_version' => self::MANIFEST_VERSION,
            'name'             => ConnectorName::get(),
            'display_name'     => ConnectorName::displayName(),
            'version'          => McpVersion::current(),
            'description'      => 'Leave reporting for ' . \App\Models\SystemSetting::getCompanyName()
                . ': leave requests, department and leave-type breakdowns, and employee balances, queried from an MCP-compatible AI client.',
            'author'           => [
                'name' => 'AI Singapore',
            ],
            'server'           => [
                'type'        => 'node',
                'entry_point' => 'server/index.js',
                'mcp_config'  => [
                    'command' => 'node',
                    'args'    => ['${__dirname}/server/index.js'],
                    'env'     => [
                        'MCPB_SERVER_URL' => $this->endpoint(),
                        // Baked bundles carry the credential itself; otherwise
                        // the client substitutes the sensitive user_config
                        // field, which it keeps in the OS keychain.
                        'MCPB_API_KEY'    => $plainKey ?? '${user_config.api_key}',
                    ],
                ],
            ],
            // Nothing to fill in when the key is baked. Left as an optional
            // override so a baked bundle can still be pointed at a different
            // key without rebuilding it.
            'user_config'      => [
                'api_key' => [
                    'type'        => 'string',
                    'title'       => 'API Key',
                    'description' => $plainKey !== null
                        ? 'Already set for this bundle. Fill this in only to override the key it was built with.'
                        : 'An MCP API key for your admin account. Generate one in '
                            . rtrim((string) config('app.url'), '/') . '/settings/mcp',
                    'sensitive'   => true,
                    'required'    => $plainKey === null,
                ],
            ],
            'tools'            => $this->tools($user),
            'keywords'         => ['hr', 'leave', 'reporting', 'aisingapore'],
            'homepage'         => rtrim((string) config('app.url'), '/'),
            'compatibility'    => [
                'runtimes' => ['node' => '>=18.0.0'],
            ],
        ];
    }

    /**
     * Build the bundle and return its absolute path.
     */
    public function build(User $user, ?ApiKey $bakedKey = null): string
    {
        if (!class_exists(ZipArchive::class)) {
            throw new RuntimeException('The PHP Zip extension is required to build an MCP bundle.');
        }

        File::ensureDirectoryExists($this->outputDirectory());

        $manifest = json_encode(
            $this->manifest($user, $bakedKey),
            JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        );

        if ($manifest === false) {
            throw new RuntimeException('Could not encode the MCP manifest.');
        }

        $path = $this->path($bakedKey);
        $zip  = new ZipArchive();

        if ($zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException("Could not open {$path} for writing.");
        }

        $zip->addFromString('manifest.json', $manifest);
        $zip->addFromString('server/index.js', $this->serverScript());
        $zip->addFromString('README.md', $this->readme($user, $bakedKey));
        $zip->close();

        return $path;
    }

    /**
     * The stdio server, with this deployment's details baked in.
     */
    private function serverScript(): string
    {
        $template = resource_path('mcpb/server/index.js');

        if (!File::exists($template)) {
            throw new RuntimeException("The MCP server template is missing at {$template}.");
        }

        return str_replace(
            ['{{SERVER_URL}}', '{{CONNECTOR_NAME}}', '{{VERSION}}'],
            [$this->endpoint(), ConnectorName::get(), McpVersion::current()],
            (string) File::get($template)
        );
    }

    /**
     * The absolute URL of this deployment's MCP endpoint.
     *
     * Built from config('app.url') rather than the current request, so a
     * bundle generated over a tunnel or behind a proxy still points at the
     * address the app knows itself by. An APP_URL left at http://localhost
     * produces a bundle that only works on that machine — which the admin
     * screen warns about before the download.
     */
    public function endpoint(): string
    {
        return rtrim((string) config('app.url'), '/') . '/api/mcp';
    }

    /**
     * Tool entries for the manifest: name plus description, no schemas.
     *
     * @return list<array<string, string>>
     */
    private function tools(User $user): array
    {
        $tools = [];

        foreach ($this->registry->visibleTo($user) as $tool) {
            $tools[] = [
                'name'        => $tool->name(),
                'description' => $tool->description(),
            ];
        }

        return $tools;
    }

    private function readme(User $user, ?ApiKey $bakedKey = null): string
    {
        $toolLines = [];

        foreach ($this->registry->visibleTo($user) as $tool) {
            $toolLines[] = '- `' . $tool->name() . '` — ' . $tool->description();
        }

        $settingsUrl = rtrim((string) config('app.url'), '/') . '/settings/mcp';

        $header = $bakedKey instanceof ApiKey
            ? [
                '# ' . ConnectorName::displayName() . ' — MCP Bundle (contains a key)',
                '',
                '> **This file contains a live API key.** Anyone who opens it can read leave',
                '> data for the whole organisation. Treat it like a password: do not email it,',
                '> put it in shared storage, or commit it to a repository.',
                '',
                'Everything is pre-filled — server address, version, connection name and the',
                'API key. Install it and it works; there is nothing to type.',
                '',
                '- **Connection name:** `' . ConnectorName::get() . '`',
                '- **Endpoint:** ' . $this->endpoint(),
                '- **Version:** ' . McpVersion::current(),
                '- **Key:** `' . $bakedKey->name . '`, acting as ' . ($bakedKey->user?->email ?? 'unknown'),
                '- **Requires:** Node.js 18 or newer (no packages to install)',
                '',
                '## If this file leaks',
                '',
                'Revoke the key and the bundle stops working immediately, everywhere it is',
                'installed — the key is checked against the server on every single request,',
                'so there is no cached access to expire:',
                '',
                '1. Go to ' . $settingsUrl,
                '2. Find the key named `' . $bakedKey->name . '` and press **Revoke**',
                '3. Generate a replacement and download a fresh bundle',
                '',
                '## Tools',
                '',
            ]
            : [
                '# ' . ConnectorName::displayName() . ' — MCP Bundle',
                '',
                'Connects an MCP-compatible AI client to the HR leave system for reporting.',
                'The server address, version and connection name are baked into this bundle;',
                'the only thing to supply on install is your API key.',
                '',
                '- **Connection name:** `' . ConnectorName::get() . '`',
                '- **Endpoint:** ' . $this->endpoint(),
                '- **Version:** ' . McpVersion::current(),
                '- **Requires:** Node.js 18 or newer (no packages to install)',
                '',
                '## Setup',
                '',
                '1. In the leave system, go to **Settings → MCP Server** and generate an API key.',
                '2. Install this bundle in your client and paste the key when asked.',
                '   It is exactly 64 characters — no quotes, no trailing spaces.',
                '3. The key inherits your own permissions — admin or super admin only.',
                '',
                '## Tools',
                '',
            ];

        $lines = array_merge($header, $toolLines, [
            '',
            '## Notes',
            '',
            'Report results include a `truncated` flag. When it is true you are seeing a',
            'page of rows, but the totals alongside are computed over the whole result set.',
            '',
            'Revoke a key at any time from ' . $settingsUrl . '; the connection stops',
            'working immediately, wherever the bundle is installed.',
            '',
            'Generated ' . now()->format('Y-m-d H:i') . '.',
        ]);

        return implode("\n", $lines) . "\n";
    }
}
