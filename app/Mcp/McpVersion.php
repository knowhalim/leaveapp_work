<?php

declare(strict_types=1);

namespace App\Mcp;

use Illuminate\Support\Facades\File;

/**
 * The version string stamped into bundles, manifests and serverInfo.
 *
 * A client treats the manifest version as the bundle's identity: same version
 * means same bundle, so it will not offer an upgrade. That makes a *stale*
 * version worse than a crude one.
 *
 * This deliberately does not read git. The deploy rsync excludes `.git`, but
 * servers provisioned by an earlier clone still have one — so reading it
 * reported a commit from months before the deployed code, identically on every
 * server, forever. Instead the version is derived from the MCP surface that
 * actually ships: the tool names, their descriptions and the stdio bridge.
 * It changes when and only when the thing a client cares about changes.
 *
 * Operators who want to control the number set MCP_VERSION.
 */
final class McpVersion
{
    private const BASE = '1.0.0';

    private static ?string $cached = null;

    public static function current(): string
    {
        if (self::$cached !== null) {
            return self::$cached;
        }

        $configured = config('mcp.version');

        if (is_string($configured) && trim($configured) !== '') {
            return self::$cached = trim($configured);
        }

        return self::$cached = self::BASE . '+' . self::surfaceHash();
    }

    /**
     * Forget the memoised value. For tests that change the tool set.
     */
    public static function flush(): void
    {
        self::$cached = null;
    }

    /**
     * A short hash over everything a client would notice changing.
     *
     * Tool names and descriptions because they are what the model reads, and
     * the bridge script because a fix there needs clients to reinstall. Input
     * schemas are deliberately excluded: they are delivered live over
     * `tools/list`, so a schema tweak needs no new bundle.
     */
    private static function surfaceHash(): string
    {
        $parts = [];

        foreach (app(ToolRegistry::class)->all() as $tool) {
            $parts[] = $tool->name() . "\0" . $tool->description();
        }

        sort($parts);

        $bridge = resource_path('mcpb/server/index.js');
        if (File::exists($bridge)) {
            $parts[] = hash('sha256', (string) File::get($bridge));
        }

        return substr(hash('sha256', implode("\n", $parts)), 0, 8);
    }
}
