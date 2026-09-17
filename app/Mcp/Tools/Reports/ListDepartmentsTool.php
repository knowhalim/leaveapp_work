<?php

declare(strict_types=1);

namespace App\Mcp\Tools\Reports;

use App\Models\Department;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Departments and their ids.
 *
 * Exists so the model never has to guess a `department_id`. Without it, the
 * only way to filter by "Engineering" is to pull every row and match on a
 * name string — which is both slower and wrong the moment two departments
 * share a word.
 */
final class ListDepartmentsTool extends ReportTool
{
    public function name(): string
    {
        return 'list_departments';
    }

    public function description(): string
    {
        return 'List all departments with their ids, manager and employee count. '
            . 'Call this first to turn a department name mentioned by the user into the department_id that the report tools expect.';
    }

    public function inputSchema(): array
    {
        return [
            'type'                 => 'object',
            'properties'           => new \stdClass(),
            'required'             => [],
            'additionalProperties' => false,
        ];
    }

    public function handle(array $arguments, User $user): array
    {
        $headcount = DB::table('employees')
            ->select('department_id', DB::raw('COUNT(*) as employees'))
            ->groupBy('department_id')
            ->pluck('employees', 'department_id');

        $rows = Department::query()
            ->with('manager')
            ->orderBy('name')
            ->get()
            ->map(fn (Department $d) => [
                'id'        => $d->id,
                'name'      => $d->name,
                'manager'   => $d->manager?->name,
                'employees' => (int) ($headcount[$d->id] ?? 0),
            ])
            ->all();

        return [
            'total_rows' => count($rows),
            'rows'       => $rows,
        ];
    }
}
