<?php

declare(strict_types=1);

namespace App\Mcp;

use App\Models\SystemSetting;

/**
 * What this MCP connection is called on the machine that uses it.
 *
 * People run several MCP servers side by side in one client, and this system
 * is deployed three times over — dev, staging, production — against the same
 * codebase. A hardcoded name would collide in exactly the case that matters
 * most: an admin connected to staging and production at once, unable to tell
 * which one just returned the numbers they are about to act on.
 *
 * One source of truth, three consumers: the manifest's machine `name`, its
 * `display_name`, and the filename the bundle downloads as.
 */
final class ConnectorName
{
    public const SETTING = 'mcp_connector_name';

    public const FALLBACK = 'aiapleave';

    /**
     * Longest name accepted. Client configs document no limit, but a key long
     * enough to wrap in a terminal is a key nobody can read in an error.
     */
    public const MAX_LENGTH = 64;

    /**
     * The name in force: the admin's if they set one, else the derived default.
     */
    public static function get(): string
    {
        $stored = self::stored();

        return $stored !== '' ? $stored : self::defaultName();
    }

    public static function stored(): string
    {
        return self::sanitize(SystemSetting::get(self::SETTING, ''));
    }

    public static function isCustom(): bool
    {
        return self::stored() !== '';
    }

    /**
     * The name used until somebody chooses one.
     *
     * Derived from the host, not the product: "aiapleave" three times in one
     * client is the collision this exists to prevent, and it says nothing
     * about which deployment is being addressed. `stg-leave.aiap.sg` becomes
     * `stg-leave-aiap-sg`, which is ugly and completely unambiguous.
     */
    public static function defaultName(): string
    {
        $host = parse_url((string) config('app.url'), PHP_URL_HOST);
        $name = self::sanitize(strtolower((string) $host));

        return $name !== '' ? $name : self::FALLBACK;
    }

    /**
     * The label a human reads in the client's connector list.
     */
    public static function displayName(): string
    {
        if (self::isCustom()) {
            return self::get();
        }

        $company = SystemSetting::getCompanyName();
        $host    = parse_url((string) config('app.url'), PHP_URL_HOST);

        return $host ? "{$company} — {$host}" : $company;
    }

    /**
     * Reduce anything typed into the field to a legal config key.
     *
     * Letters, digits, hyphen and underscore survive; everything else — spaces,
     * punctuation, emoji — collapses to a single hyphen, so "AISG Leave
     * (staging)!" comes back as "AISG-Leave-staging" rather than being
     * refused. Truncates rather than rejects: somebody who pasted a sentence
     * gets a usable key back and can see what it became.
     */
    public static function sanitize(mixed $raw): string
    {
        $raw = is_scalar($raw) ? (string) $raw : '';

        $name = (string) preg_replace('/[^A-Za-z0-9_-]+/', '-', $raw);
        $name = (string) preg_replace('/-{2,}/', '-', $name);
        $name = trim($name, '-');

        if (strlen($name) > self::MAX_LENGTH) {
            $name = rtrim(substr($name, 0, self::MAX_LENGTH), '-');
        }

        return $name;
    }
}
