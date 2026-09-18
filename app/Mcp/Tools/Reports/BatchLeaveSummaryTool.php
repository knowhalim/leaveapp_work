<?php

declare(strict_types=1);

namespace App\Mcp\Tools\Reports;

use App\Models\EmployeeLeaveBalance;
use App\Models\User;

/**
 * Leave taken and left, per person, grouped by batch.
 *
 * "Batch" is not a column on this system — apprentice cohorts are recorded in
 * `employees.position` ("AIAP100", "AIAP22-6M"), the same field the position
 * filter and mass-email-by-position features group on. This tool reads that
 * convention rather than inventing a new one, so it keeps working without a
 * schema change and stays consistent with what admins already see in the UI.
 *
 * Because the field is free text, two spellings of one cohort are possible and
 * do happen. They are reported separately — silently merging them would be a
 * guess presented as a fact — but near-duplicates are flagged so somebody can
 * fix the data.
 */
final class BatchLeaveSummaryTool extends ReportTool
{
    /**
     * Cap on people listed. Batch totals ignore this and cover everyone.
     */
    protected const DEFAULT_LIMIT = 200;

    public function name(): string
    {
        return 'batch_leave_summary_report';
    }

    public function description(): string
    {
        return 'Leave taken and remaining for each person, grouped by batch (the apprentice cohort recorded in their position field, e.g. "AIAP100", "AIAP22-6M"). '
            . 'Defaults to employee type "Apprentice". Each person shows entitled, taken, pending, remaining and available days, and each batch carries its own totals and head count. '
            . 'By default figures are summed across every leave type, which mixes vacation with medical and maternity — pass leave_type_id for a single meaningful entitlement. '
            . 'Use this for "how much leave has each apprentice in batch X used" and for end-of-cohort leave clearing.';
    }

    public function inputSchema(): array
    {
        return [
            'type'       => 'object',
            'properties' => array_merge($this->commonProperties(), [
                'batch' => [
                    'type'        => 'string',
                    'description' => 'Restrict to one batch, matched against the position field (e.g. "AIAP100"). Partial matches are allowed. Omit for every batch.',
                ],
                'employee_type' => [
                    'type'        => 'string',
                    'description' => 'Employee type to include, e.g. "Apprentice", "Intern", "Mentor". Defaults to "Apprentice". Pass "all" for every type.',
                ],
                'leave_type_id' => [
                    'type'        => 'integer',
                    'description' => 'Restrict figures to one leave type. Call list_leave_types to resolve a name to its id. Strongly recommended — otherwise totals sum across all leave types.',
                ],
                'include_zero_activity' => [
                    'type'        => 'boolean',
                    'description' => 'When true, include people who have taken no leave at all. Defaults to true; set false to see only those with activity.',
                ],
            ]),
            'required'             => [],
            'additionalProperties' => false,
        ];
    }

    public function handle(array $arguments, User $user): array
    {
        $year          = $this->resolveYear($arguments);
        $limit         = $this->resolveLimit($arguments);
        $employeeType  = trim((string) ($arguments['employee_type'] ?? 'Apprentice'));
        $includeZero   = $arguments['include_zero_activity'] ?? true;

        $query = EmployeeLeaveBalance::query()
            ->with(['employee.user', 'employee.employeeType', 'leaveType'])
            ->where('financial_year', $year);

        if ($employeeType !== '' && strtolower($employeeType) !== 'all') {
            $query->whereHas(
                'employee.employeeType',
                fn ($q) => $q->where('name', $employeeType)
            );
        }

        if (!empty($arguments['batch'])) {
            $batch = $arguments['batch'];
            $query->whereHas('employee', fn ($q) => $q->where('position', 'like', "%{$batch}%"));
        }

        if (!empty($arguments['leave_type_id'])) {
            $query->where('leave_type_id', (int) $arguments['leave_type_id']);
        }

        // Balances are per leave type; the report is per person, so they are
        // folded together here. available_balance is an accessor, so this part
        // cannot be pushed into SQL.
        $people = [];

        foreach ($query->get() as $balance) {
            $employee = $balance->employee;
            $account  = $employee?->user;

            if (!$employee || !$account) {
                continue;
            }

            $key = $employee->id;

            $people[$key] ??= [
                'batch'     => $this->batchOf($employee->position),
                'employee'  => $account->name,
                'email'     => $account->email,
                'type'      => $employee->employeeType?->name,
                'entitled'  => 0.0,
                'taken'     => 0.0,
                'pending'   => 0.0,
                'remaining' => 0.0,
                'available' => 0.0,
            ];

            $people[$key]['entitled']  += (float) $balance->total_entitled;
            $people[$key]['taken']     += (float) $balance->used_days;
            $people[$key]['pending']   += (float) $balance->pending_days;
            $people[$key]['remaining'] += (float) $balance->remaining_balance;
            $people[$key]['available'] += (float) $balance->available_balance;
        }

        if (!$includeZero) {
            $people = array_filter($people, static fn (array $p): bool => $p['taken'] > 0 || $p['pending'] > 0);
        }

        // Group into batches, rounding only at the edge so repeated addition
        // of halves does not drift.
        $batches = [];

        foreach ($people as $person) {
            $name = $person['batch'];

            $batches[$name] ??= [
                'batch'     => $name,
                'headcount' => 0,
                'totals'    => ['entitled' => 0.0, 'taken' => 0.0, 'pending' => 0.0, 'remaining' => 0.0, 'available' => 0.0],
                'employees' => [],
            ];

            $batches[$name]['headcount']++;

            foreach (['entitled', 'taken', 'pending', 'remaining', 'available'] as $field) {
                $batches[$name]['totals'][$field] += $person[$field];
            }

            $batches[$name]['employees'][] = [
                'employee'  => $person['employee'],
                'email'     => $person['email'],
                'entitled'  => round($person['entitled'], 2),
                'taken'     => round($person['taken'], 2),
                'pending'   => round($person['pending'], 2),
                'remaining' => round($person['remaining'], 2),
                'available' => round($person['available'], 2),
            ];
        }

        ksort($batches);

        $totalPeople = count($people);
        $shown       = 0;

        foreach ($batches as $name => $batch) {
            usort(
                $batches[$name]['employees'],
                static fn (array $a, array $b): int => $b['taken'] <=> $a['taken']
            );

            // The cap is on people listed, applied across batches in order.
            // Batch totals above were summed before any trimming.
            $room = max(0, $limit - $shown);
            $batches[$name]['employees'] = array_slice($batches[$name]['employees'], 0, $room);
            $shown += count($batches[$name]['employees']);

            foreach ($batches[$name]['totals'] as $field => $value) {
                $batches[$name]['totals'][$field] = round($value, 2);
            }
        }

        return [
            'financial_year'  => $year,
            'employee_type'   => $employeeType !== '' ? $employeeType : 'Apprentice',
            'leave_type_id'   => $arguments['leave_type_id'] ?? null,
            'spans_all_leave_types' => empty($arguments['leave_type_id']),
            'total_people'    => $totalPeople,
            'listed_people'   => $shown,
            'truncated'       => $shown < $totalPeople,
            'row_limit'       => $limit,
            'batches'         => array_values($batches),
            'field_notes'     => [
                'taken'     => 'Days already used (approved and consumed).',
                'pending'   => 'Days in requests awaiting approval.',
                'remaining' => 'Entitled minus taken. Ignores pending requests.',
                'available' => 'Remaining minus pending — what can still be booked today.',
            ],
            'possible_duplicate_batches' => $this->nearDuplicates(array_keys($batches)),
        ];
    }

    /**
     * The batch label for a position, or a marker when it is unset.
     *
     * An apprentice with no position is a data gap, not a batch called "".
     * Naming it makes it visible in the output instead of producing a blank
     * row somebody scrolls past.
     */
    private function batchOf(?string $position): string
    {
        $position = trim((string) $position);

        return $position !== '' ? $position : '(no batch set)';
    }

    /**
     * Batch names that differ only by punctuation or case.
     *
     * "AIAP22-6M" and "AIAP22_6M" are one cohort typed two ways. They stay
     * separate in the figures — merging on a hunch would report numbers
     * nobody can trace — but they are named here so the data can be fixed.
     *
     * @param  list<string>  $names
     * @return list<list<string>>
     */
    private function nearDuplicates(array $names): array
    {
        $groups = [];

        foreach ($names as $name) {
            $key = strtolower((string) preg_replace('/[^a-z0-9]/i', '', $name));

            if ($key === '') {
                continue;
            }

            $groups[$key][] = $name;
        }

        return array_values(array_filter($groups, static fn (array $g): bool => count($g) > 1));
    }
}
