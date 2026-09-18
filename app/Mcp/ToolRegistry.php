<?php

declare(strict_types=1);

namespace App\Mcp;

use App\Mcp\Contracts\McpTool;
use App\Mcp\Tools\Reports\BatchLeaveSummaryTool;
use App\Mcp\Tools\Reports\DepartmentSummaryTool;
use App\Mcp\Tools\Reports\EmployeeBalanceTool;
use App\Mcp\Tools\Reports\LeaveSummaryTool;
use App\Mcp\Tools\Reports\LeaveTypeBreakdownTool;
use App\Mcp\Tools\Reports\ListDepartmentsTool;
use App\Mcp\Tools\Reports\ListLeaveTypesTool;
use App\Models\User;

/**
 * Every tool this server exposes.
 *
 * Registration is an explicit list rather than a directory scan: a tool that
 * reaches an AI client should do so because somebody added a line here, not
 * because a file landed in a folder.
 *
 * To add a capability — leave checking, leave submission — write the class and
 * append it to TOOLS. `tools/list`, the .mcpb manifest and the generated docs
 * all follow automatically.
 */
final class ToolRegistry
{
    /** @var list<class-string<McpTool>> */
    private const TOOLS = [
        // Reporting (phase 1)
        LeaveSummaryTool::class,
        DepartmentSummaryTool::class,
        EmployeeBalanceTool::class,
        LeaveTypeBreakdownTool::class,
        BatchLeaveSummaryTool::class,
        ListDepartmentsTool::class,
        ListLeaveTypesTool::class,

        // Leave checking / submission tools slot in here.
    ];

    /** @var array<string, McpTool>|null */
    private ?array $resolved = null;

    /**
     * All tools, keyed by name.
     *
     * @return array<string, McpTool>
     */
    public function all(): array
    {
        if ($this->resolved !== null) {
            return $this->resolved;
        }

        $tools = [];

        foreach (self::TOOLS as $class) {
            $tool = app($class);
            $tools[$tool->name()] = $tool;
        }

        return $this->resolved = $tools;
    }

    /**
     * The tools $user is allowed to see and call.
     *
     * Filtering the *list* as well as the call matters: a manager who somehow
     * obtained a key should not be shown the shape of tools they cannot run,
     * and a client that lists nothing is a clearer signal than one that lists
     * six tools which all fail.
     *
     * @return array<string, McpTool>
     */
    public function visibleTo(User $user): array
    {
        return array_filter(
            $this->all(),
            static fn (McpTool $tool): bool => self::satisfies($user, $tool->role())
        );
    }

    public function find(string $name): ?McpTool
    {
        return $this->all()[$name] ?? null;
    }

    /**
     * Does $user hold at least $role?
     *
     * Leans on the model's own helpers so the hierarchy is defined in exactly
     * one place — isAdmin() already treats super_admin as an admin.
     */
    public static function satisfies(User $user, string $role): bool
    {
        return match ($role) {
            'super_admin' => $user->isSuperAdmin(),
            'admin'       => $user->isAdmin(),
            'manager'     => $user->isManager(),
            default       => true,
        };
    }

    /**
     * The `tools/list` payload for $user.
     *
     * @return list<array<string, mixed>>
     */
    public function describeFor(User $user): array
    {
        $described = [];

        foreach ($this->visibleTo($user) as $tool) {
            $described[] = [
                'name'        => $tool->name(),
                'description' => $tool->description(),
                'inputSchema' => $tool->inputSchema(),
                'annotations' => [
                    'readOnlyHint' => $tool->readOnly(),
                ],
            ];
        }

        return $described;
    }
}
