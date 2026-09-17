<?php

declare(strict_types=1);

namespace App\Mcp\Tools\Reports;

use App\Models\LeaveRequest;
use App\Models\User;

/**
 * Individual leave requests, filtered.
 *
 * The workhorse: every other report aggregates, this one shows the rows those
 * aggregates were built from, so a question like "who in Engineering took
 * medical leave in March" has somewhere to land.
 */
final class LeaveSummaryTool extends ReportTool
{
    public function name(): string
    {
        return 'leave_summary_report';
    }

    public function description(): string
    {
        return 'List individual leave requests for a financial year, optionally filtered by department, leave type, status or date range. '
            . 'Returns one row per request (employee, department, leave type, dates, days, status) plus counts by status across the whole filtered set. '
            . 'Use this when the question is about specific requests or specific people; use department_summary_report or leave_type_breakdown_report when the question is about totals.';
    }

    public function inputSchema(): array
    {
        return [
            'type'       => 'object',
            'properties' => array_merge($this->commonProperties(), [
                'department_id' => [
                    'type'        => 'integer',
                    'description' => 'Restrict to one department. Call list_departments to resolve a department name to its id.',
                ],
                'leave_type_id' => [
                    'type'        => 'integer',
                    'description' => 'Restrict to one leave type. Call list_leave_types to resolve a leave type name to its id.',
                ],
                'status' => [
                    'type'        => 'string',
                    'enum'        => ['pending', 'approved', 'rejected', 'cancelled'],
                    'description' => 'Restrict to one status. Omit for all statuses.',
                ],
                'start_date_from' => [
                    'type'        => 'string',
                    'format'      => 'date',
                    'description' => 'Only requests starting on or after this date (YYYY-MM-DD).',
                ],
                'start_date_to' => [
                    'type'        => 'string',
                    'format'      => 'date',
                    'description' => 'Only requests starting on or before this date (YYYY-MM-DD).',
                ],
            ]),
            'required'             => [],
            'additionalProperties' => false,
        ];
    }

    public function handle(array $arguments, User $user): array
    {
        $year  = $this->resolveYear($arguments);
        $limit = $this->resolveLimit($arguments);

        $query = LeaveRequest::query()
            ->with(['employee.user', 'employee.department', 'leaveType'])
            ->where('financial_year', $year);

        if (!empty($arguments['department_id'])) {
            $query->whereHas('employee', fn ($q) => $q->where('department_id', (int) $arguments['department_id']));
        }

        if (!empty($arguments['leave_type_id'])) {
            $query->where('leave_type_id', (int) $arguments['leave_type_id']);
        }

        if (!empty($arguments['status'])) {
            $query->where('status', $arguments['status']);
        }

        if (!empty($arguments['start_date_from'])) {
            $query->whereDate('start_date', '>=', $arguments['start_date_from']);
        }

        if (!empty($arguments['start_date_to'])) {
            $query->whereDate('start_date', '<=', $arguments['start_date_to']);
        }

        // Counted before the page is taken, so the summary describes the whole
        // filtered set even when the rows are cut short.
        $total = (clone $query)->count();

        $byStatus = (clone $query)
            ->selectRaw('status, COUNT(*) as count, SUM(total_days) as days')
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn ($r) => [$r->status => [
                'requests' => (int) $r->count,
                'days'     => round((float) $r->days, 2),
            ]])
            ->all();

        $rows = $query->orderByDesc('start_date')
            ->limit($limit)
            ->get()
            ->map(fn (LeaveRequest $r) => [
                'id'          => $r->id,
                'employee'    => $r->employee?->user?->name,
                'email'       => $r->employee?->user?->email,
                'department'  => $r->employee?->department?->name,
                'leave_type'  => $r->leaveType?->name,
                'start_date'  => $r->start_date?->format('Y-m-d'),
                'end_date'    => $r->end_date?->format('Y-m-d'),
                'total_days'  => (float) $r->total_days,
                'status'      => $r->status,
                'submitted'   => $r->created_at?->format('Y-m-d'),
            ])
            ->all();

        return $this->envelope($year, $rows, $total, $limit, [
            'totals_by_status' => $byStatus,
        ]);
    }
}
