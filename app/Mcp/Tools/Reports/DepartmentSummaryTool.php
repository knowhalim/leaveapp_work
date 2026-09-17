<?php

declare(strict_types=1);

namespace App\Mcp\Tools\Reports;

use App\Models\Department;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Leave totals per department.
 *
 * Aggregated in SQL rather than by walking every employee's requests in PHP,
 * which is what the CSV equivalent does; on a few hundred staff that is the
 * difference between one query and several thousand.
 */
final class DepartmentSummaryTool extends ReportTool
{
    public function name(): string
    {
        return 'department_summary_report';
    }

    public function description(): string
    {
        return 'Leave totals grouped by department for a financial year: request counts by status and total approved days per department. '
            . 'Use this to compare departments or find where leave is concentrated. Departments with no requests are included with zero counts.';
    }

    public function inputSchema(): array
    {
        return [
            'type'                 => 'object',
            'properties'           => $this->commonProperties(),
            'required'             => [],
            'additionalProperties' => false,
        ];
    }

    public function handle(array $arguments, User $user): array
    {
        $year  = $this->resolveYear($arguments);
        $limit = $this->resolveLimit($arguments);

        $aggregates = LeaveRequest::query()
            ->where('leave_requests.financial_year', $year)
            ->join('employees', 'employees.id', '=', 'leave_requests.employee_id')
            ->groupBy('employees.department_id')
            ->select('employees.department_id')
            ->selectRaw('COUNT(*) as total_requests')
            ->selectRaw("SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END) as pending")
            ->selectRaw("SUM(CASE WHEN status = 'approved'  THEN 1 ELSE 0 END) as approved")
            ->selectRaw("SUM(CASE WHEN status = 'rejected'  THEN 1 ELSE 0 END) as rejected")
            ->selectRaw("SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled")
            ->selectRaw("SUM(CASE WHEN status = 'approved'  THEN total_days ELSE 0 END) as approved_days")
            ->get()
            ->keyBy('department_id');

        // Head-count per department, so "12 days across 3 people" is
        // distinguishable from "12 days taken by one person".
        $headcount = DB::table('employees')
            ->select('department_id', DB::raw('COUNT(*) as employees'))
            ->groupBy('department_id')
            ->pluck('employees', 'department_id');

        $departments = Department::query()->orderBy('name')->get();

        $rows = [];

        foreach ($departments as $department) {
            $agg = $aggregates->get($department->id);

            $rows[] = [
                'department_id'  => $department->id,
                'department'     => $department->name,
                'employees'      => (int) ($headcount[$department->id] ?? 0),
                'total_requests' => (int) ($agg->total_requests ?? 0),
                'pending'        => (int) ($agg->pending ?? 0),
                'approved'       => (int) ($agg->approved ?? 0),
                'rejected'       => (int) ($agg->rejected ?? 0),
                'cancelled'      => (int) ($agg->cancelled ?? 0),
                'approved_days'  => round((float) ($agg->approved_days ?? 0), 2),
            ];
        }

        // Employees with no department still take leave; losing their rows
        // would make the totals here disagree with every other report.
        if ($orphan = $aggregates->get(null)) {
            $rows[] = [
                'department_id'  => null,
                'department'     => 'No Department',
                'employees'      => (int) ($headcount[null] ?? 0),
                'total_requests' => (int) $orphan->total_requests,
                'pending'        => (int) $orphan->pending,
                'approved'       => (int) $orphan->approved,
                'rejected'       => (int) $orphan->rejected,
                'cancelled'      => (int) $orphan->cancelled,
                'approved_days'  => round((float) $orphan->approved_days, 2),
            ];
        }

        // Grand totals come off the full set before the page is taken —
        // summing the visible rows would silently under-report the moment a
        // caller lowers the limit.
        $grandRequests = array_sum(array_column($rows, 'total_requests'));
        $grandDays     = array_sum(array_column($rows, 'approved_days'));

        $total = count($rows);
        $rows  = array_slice($rows, 0, $limit);

        return $this->envelope($year, $rows, $total, $limit, [
            'grand_total_requests'      => $grandRequests,
            'grand_total_approved_days' => round($grandDays, 2),
        ]);
    }
}
