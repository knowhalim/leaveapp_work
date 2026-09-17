<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Mcp\ConnectorName;
use App\Mcp\McpbBuilder;
use App\Mcp\McpVersion;
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
                            {--manifest : Print the manifest instead of writing a bundle}';

    protected $description = 'Build the .mcpb MCP bundle for this deployment';

    public function handle(McpbBuilder $builder): int
    {
        $user = $this->resolveUser();

        if (!$user instanceof User) {
            return self::FAILURE;
        }

        if ($this->option('manifest')) {
            $this->line(json_encode($builder->manifest($user), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

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
            $path = $builder->build($user);
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
        ]);

        return self::SUCCESS;
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
