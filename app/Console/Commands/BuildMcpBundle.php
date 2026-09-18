<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Mcp\ConnectorName;
use App\Mcp\McpbBuilder;
use App\Mcp\McpVersion;
use App\Models\ApiKey;
use App\Models\User;
use Illuminate\Console\Command;
use Throwable;

/**
 * Build the .mcpb bundle from the command line.
 *
 * The admin screen covers the normal case. This exists for the ones it cannot:
 * producing a bundle during a deploy, and checking on a server what a bundle
 * would actually contain without clicking through the UI.
 */
final class BuildMcpBundle extends Command
{
    protected $signature = 'mcp:bundle
                            {--user= : Email of the admin to scope the tool list to (defaults to the first super admin)}
                            {--manifest : Print the manifest instead of writing a bundle}
                            {--key= : Bake this API key (id or name) into the bundle so there is nothing to paste. The file then contains a live credential}';

    protected $description = 'Build the .mcpb MCP bundle for this deployment';

    public function handle(McpbBuilder $builder): int
    {
        $user = $this->resolveUser();

        if (!$user instanceof User) {
            return self::FAILURE;
        }

        $bakedKey = null;

        if ($this->option('key')) {
            $bakedKey = $this->resolveKey((string) $this->option('key'));

            if (!$bakedKey instanceof ApiKey) {
                return self::FAILURE;
            }
        }

        if ($this->option('manifest')) {
            // The manifest is printed to a terminal and often pasted into a
            // ticket, so a baked key is masked here even though it is written
            // in full into the bundle itself.
            $manifest = $builder->manifest($user, $bakedKey);
            if ($bakedKey) {
                $manifest['server']['mcp_config']['env']['MCPB_API_KEY'] = '<baked: ' . $bakedKey->name . '>';
            }
            $this->line(json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            return self::SUCCESS;
        }

        // A bundle is only as useful as the URL inside it, and APP_URL is the
        // one setting a fresh install reliably gets wrong. Warn, but build:
        // someone testing locally has a legitimate reason to want this.
        $url = (string) config('app.url');
        if (str_contains($url, 'localhost') || str_contains($url, '127.0.0.1')) {
            $this->warn("APP_URL is {$url} — the bundle will only work on this machine.");
        }

        try {
            $path = $builder->build($user, $bakedKey);
        } catch (Throwable $e) {
            $this->error('Could not build the bundle: ' . $e->getMessage());

            return self::FAILURE;
        }

        $this->info('Built ' . basename($path));
        $this->table(['Field', 'Value'], [
            ['Connector', ConnectorName::get()],
            ['Display name', ConnectorName::displayName()],
            ['Version', McpVersion::current()],
            ['Endpoint', $builder->endpoint()],
            ['Scoped to', $user->email . ' (' . $user->role . ')'],
            ['Path', $path],
            ['Size', number_format(filesize($path) / 1024, 1) . ' KB'],
            ['Baked key', $bakedKey?->name ?? 'none (client will prompt)'],
        ]);

        if ($bakedKey) {
            $this->newLine();
            $this->warn('This file contains a live API key. Anyone who opens it can read');
            $this->warn('organisation-wide leave data. If it leaks, revoke the key named');
            $this->warn('"' . $bakedKey->name . '" and every copy stops working at once.');
        }

        return self::SUCCESS;
    }

    /**
     * Find the key to bake, by id or by name.
     */
    private function resolveKey(string $ref): ?ApiKey
    {
        $key = ctype_digit($ref)
            ? ApiKey::with('user')->find((int) $ref)
            : ApiKey::with('user')->where('name', $ref)->first();

        if (!$key) {
            $this->error("No API key matching '{$ref}'.");

            return null;
        }

        if (!$key->hasPermission('mcp.use')) {
            $this->error("Key '{$key->name}' is not an MCP key.");

            return null;
        }

        if (!$key->isValid()) {
            $this->error("Key '{$key->name}' is revoked or expired — baking it would produce a bundle that cannot connect.");

            return null;
        }

        return $key;
    }

    private function resolveUser(): ?User
    {
        $email = $this->option('user');

        if (is_string($email) && $email !== '') {
            $user = User::where('email', $email)->first();

            if (!$user) {
                $this->error("No user with email {$email}.");

                return null;
            }

            if (!$user->isAdmin()) {
                $this->error("{$email} is not an admin or super admin.");

                return null;
            }

            return $user;
        }

        $user = User::where('role', 'super_admin')->where('is_active', true)->first()
            ?? User::where('role', 'admin')->where('is_active', true)->first();

        if (!$user) {
            $this->error('No active admin account to scope the bundle to. Pass --user=someone@example.com.');

            return null;
        }

        return $user;
    }
}
