<?php

declare(strict_types=1);

namespace App\Mcp\Tools\Reports;

use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;

/**
 * Which kinds of leave are actually being taken.
 *
 * Distinct from the department report in what it answers: that one asks where
 * leave happens, this one asks what kind. Both are cheap; the model should not
 * have to pull raw rows and tally them itself.
 */
final class LeaveTypeBreakdownTool extends ReportTool
{
    public function name(): string
    {
        return 'leave_type_breakdown_report';
    }

    public function description(): string
    {
        return 'Leave totals grouped by leave type for a financial year: request counts by status, total approved days, and how many distinct employees used each type. '
            . 'Optionally scoped to one department. Use this for "which leave types are most used" or to check uptake of a specific entitlement.';
    }

    public function inputSchema(): array
    {
        return [
            'type'       => 'object',
            'properties' => array_merge($this->commonProperties(), [
                'department_id' => [
                    'type'        => 'integer',
                    'description' => 'Restrict to one department. Call list_departments to resolve a name to its id.',
                ],
                'include_unused' => [
                    'type'        => 'boolean',
                    'description' => 'When true, also list active leave types with no requests in this year (all counts zero). Useful for spotting entitlements nobody takes.',
                ],
            ]),
            'required'             => [],
            'additionalProperties' => false,
        ];
    }

    public function handle(array $arguments, User $user): array
    {
        $year         = $this->resolveYear($arguments);
        $limit        = $this->resolveLimit($arguments);
        $departmentId = !empty($arguments['department_id']) ? (int) $arguments['department_id'] : null;

        $query = LeaveRequest::query()
            ->where('leave_requests.financial_year', $year)
            ->groupBy('leave_requests.leave_type_id')
            ->select('leave_requests.leave_type_id')
            ->selectRaw('COUNT(*) as total_requests')
            ->selectRaw('COUNT(DISTINCT leave_requests.employee_id) as employees')
            ->selectRaw("SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) as pending")
            ->selectRaw("SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved")
            ->selectRaw("SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected")
            ->selectRaw("SUM(CASE WHEN status = 'approved' THEN total_days ELSE 0 END) as approved_days");

        if ($departmentId !== null) {
            $query->join('employees', 'employees.id', '=', 'leave_requests.employee_id')
                ->where('employees.department_id', $departmentId);
        }

        $aggregates = $query->get()->keyBy('leave_type_id');

        $types = LeaveType::query()
            ->when(!($arguments['include_unused'] ?? false), fn ($q) => $q->whereIn('id', $aggregates->keys()))
            ->when($arguments['include_unused'] ?? false, fn ($q) => $q->where('is_active', true))
            ->orderBy('name')
            ->get();

        $rows = [];

        foreach ($types as $type) {
            $agg = $aggregates->get($type->id);

            $rows[] = [
                'leave_type_id'  => $type->id,
                'leave_type'     => $type->name,
                'code'           => $type->code,
                'is_paid'        => (bool) $type->is_paid,
                'employees'      => (int) ($agg->employees ?? 0),
                'total_requests' => (int) ($agg->total_requests ?? 0),
                'pending'        => (int) ($agg->pending ?? 0),
                'approved'       => (int) ($agg->approved ?? 0),
                'rejected'       => (int) ($agg->rejected ?? 0),
                'approved_days'  => round((float) ($agg->approved_days ?? 0), 2),
            ];
        }

        // Busiest first: the answer to "which types are most used" should be
        // the top of the list, not something the model has to sort for itself.
        usort($rows, static fn (array $a, array $b) => $b['approved_days'] <=> $a['approved_days']);

        $grandRequests = array_sum(array_column($rows, 'total_requests'));
        $grandDays     = array_sum(array_column($rows, 'approved_days'));

        $total = count($rows);
        $rows  = array_slice($rows, 0, $limit);

        return $this->envelope($year, $rows, $total, $limit, [
            'department_id'             => $departmentId,
            'grand_total_requests'      => $grandRequests,
            'grand_total_approved_days' => round($grandDays, 2),
        ]);
    }
}
