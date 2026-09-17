<?php

declare(strict_types=1);

namespace App\Mcp\Tools\Reports;

use App\Models\LeaveType;
use App\Models\User;

/**
 * Leave types and their ids.
 *
 * The companion to {@see ListDepartmentsTool}. This install seeds 29 Singapore
 * leave types whose names overlap heavily ("Medical Leave", "Hospitalisation
 * Leave", "Childcare Leave", "Extended Childcare Leave"), so name-matching
 * from the model side is genuinely unsafe — it needs the list.
 */
final class ListLeaveTypesTool extends ReportTool
{
    public function name(): string
    {
        return 'list_leave_types';
    }

    public function description(): string
    {
        return 'List leave types with their ids, code, paid flag and default entitlement. '
            . 'Call this first to turn a leave type mentioned by the user into the leave_type_id that the report tools expect. '
            . 'Names are similar to one another on this system, so do not guess an id.';
    }

    public function inputSchema(): array
    {
        return [
            'type'       => 'object',
            'properties' => [
                'include_inactive' => [
                    'type'        => 'boolean',
                    'description' => 'When true, also list deactivated leave types. Historic reports may reference these.',
                ],
            ],
            'required'             => [],
            'additionalProperties' => false,
        ];
    }

    public function handle(array $arguments, User $user): array
    {
        $rows = LeaveType::query()
            ->when(!($arguments['include_inactive'] ?? false), fn ($q) => $q->where('is_active', true))
            ->orderBy('name')
            ->get()
            ->map(fn (LeaveType $t) => [
                'id'             => $t->id,
                'name'           => $t->name,
                'code'           => $t->code,
                'is_paid'        => (bool) $t->is_paid,
                'is_active'      => (bool) $t->is_active,
                'default_days'   => (int) $t->default_days,
                'allows_half_day'=> (bool) $t->allows_half_day,
            ])
            ->all();

        return [
            'total_rows' => count($rows),
            'rows'       => $rows,
        ];
    }
}
