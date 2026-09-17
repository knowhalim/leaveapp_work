<?php

declare(strict_types=1);

namespace App\Mcp\Tools\Reports;

use App\Models\EmployeeLeaveBalance;
use App\Models\User;

/**
 * Entitlement and consumption per employee, per leave type.
 *
 * The report people actually ask for by name ("how much annual leave does X
 * have left"), so it takes an email as well as the bulk filters.
 */
final class EmployeeBalanceTool extends ReportTool
{
    public function name(): string
    {
        return 'employee_balance_report';
    }

    public function description(): string
    {
        return 'Leave balances per employee per leave type for a financial year: entitled, carried over, adjustment, used, pending and available days. '
            . 'Filter by employee email for one person, or by department for a team. '
            . 'Use this for "how much leave does X have left" and for spotting unused entitlement before year end.';
    }

    public function inputSchema(): array
    {
        return [
            'type'       => 'object',
            'properties' => array_merge($this->commonProperties(), [
                'email' => [
                    'type'        => 'string',
                    'format'      => 'email',
                    'description' => 'Restrict to one employee by their login email address.',
                ],
                'department_id' => [
                    'type'        => 'integer',
                    'description' => 'Restrict to one department. Call list_departments to resolve a name to its id.',
                ],
                'leave_type_id' => [
                    'type'        => 'integer',
                    'description' => 'Restrict to one leave type. Call list_leave_types to resolve a name to its id.',
                ],
                'only_with_balance' => [
                    'type'        => 'boolean',
                    'description' => 'When true, omit rows where no days remain. Useful for "who still has leave to use".',
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

        $query = EmployeeLeaveBalance::query()
            ->with(['employee.user', 'employee.department', 'leaveType'])
            ->where('financial_year', $year);

        if (!empty($arguments['email'])) {
            $email = $arguments['email'];
            $query->whereHas('employee.user', fn ($q) => $q->where('email', $email));
        }

        if (!empty($arguments['department_id'])) {
            $query->whereHas('employee', fn ($q) => $q->where('department_id', (int) $arguments['department_id']));
        }

        if (!empty($arguments['leave_type_id'])) {
            $query->where('leave_type_id', (int) $arguments['leave_type_id']);
        }

        $balances = $query->get();

        // available_balance is a computed accessor, not a column, so this
        // filter and the sort below cannot be pushed into SQL.
        if (!empty($arguments['only_with_balance'])) {
            $balances = $balances->filter(fn (EmployeeLeaveBalance $b) => $b->available_balance > 0);
        }

        $total = $balances->count();

        $rows = $balances
            ->sortBy([
                fn ($a, $b) => strcmp((string) $a->employee?->user?->name, (string) $b->employee?->user?->name),
            ])
            ->take($limit)
            ->map(fn (EmployeeLeaveBalance $b) => [
                'employee'     => $b->employee?->user?->name,
                'email'        => $b->employee?->user?->email,
                'department'   => $b->employee?->department?->name,
                'leave_type'   => $b->leaveType?->name,
                'entitled'     => (float) $b->entitled_days,
                'carried_over' => (float) $b->carried_over,
                'adjustment'   => (float) $b->adjustment,
                'used'         => (float) $b->used_days,
                'pending'      => (float) $b->pending_days,
                'available'    => round((float) $b->available_balance, 2),
            ])
            ->values()
            ->all();

        return $this->envelope($year, $rows, $total, $limit);
    }
}
