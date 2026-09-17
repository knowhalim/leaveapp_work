<?php

declare(strict_types=1);

namespace App\Mcp;

use Illuminate\Support\Facades\File;

/**
 * The version string stamped into bundles, manifests and serverInfo.
 *
 * This app carries no version of its own — no `version` in package.json, none
 * in config/app.php — so rather than inventing a constant that nobody will
 * remember to bump, the version is derived: `mcp.version` if an operator sets
 * one, else the deployed commit, else a stable fallback.
 *
 * It matters because a client treats the manifest version as the bundle's
 * identity for upgrades. Two different toolsets sharing a version number is
 * the failure this avoids.
 */
final class McpVersion
{
    private const FALLBACK = '1.0.0';

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

        return self::$cached = self::FALLBACK . '+' . self::commit();
    }

    /**
     * Short commit of the deployed tree, or 'unknown'.
     *
     * Read from .git directly rather than shelling out to git: the deploy
     * rsync excludes .git, so on a server this is expected to miss, and
     * spawning a process to discover that on every manifest build is waste.
     */
    private static function commit(): string
    {
        $head = base_path('.git/HEAD');

        if (!File::exists($head)) {
            return 'unknown';
        }

        $contents = trim((string) File::get($head));

        if (str_starts_with($contents, 'ref: ')) {
            $ref  = substr($contents, 5);
            $path = base_path('.git/' . $ref);

            if (File::exists($path)) {
                return substr(trim((string) File::get($path)), 0, 7);
            }

            // Packed refs: the loose file is absent once git has packed it.
            $packed = base_path('.git/packed-refs');
            if (File::exists($packed) && preg_match('/^([0-9a-f]{40})\s+' . preg_quote($ref, '/') . '$/m', (string) File::get($packed), $m)) {
                return substr($m[1], 0, 7);
            }

            return 'unknown';
        }

        return preg_match('/^[0-9a-f]{40}$/', $contents) ? substr($contents, 0, 7) : 'unknown';
    }
}
