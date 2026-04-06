<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\EmailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportApiController extends Controller
{
    /**
     * POST /api/v1/reports/generate
     *
     * Generates a CSV report and emails it as an attachment to the requesting user.
     * Requires role: admin or super_admin.
     *
     * Body params:
     *   email        (required) - requesting user's email
     *   report_type  (required) - one of: leave_summary, department_summary, employee_leave
     *   year         (optional) - financial year (defaults to current)
     *   department_id (optional) - filter by department
     */
    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'email'         => ['required', 'email', 'exists:users,email'],
            'report_type'   => ['required', 'in:leave_summary,department_summary,employee_leave'],
            'year'          => ['nullable', 'string', 'max:10'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
        ]);

        $requestingUser = User::where('email', $request->email)->first();

        if (!$requestingUser->isAdmin()) {
            return response()->json([
                'error'          => 'Your role does not have permission to generate reports.',
                'role'           => $requestingUser->role,
                'required_roles' => ['admin', 'super_admin'],
            ], 403);
        }

        $financialYear = $request->filled('year')
            ? $request->year
            : SystemSetting::getFinancialYear();

        $csvContent = match ($request->report_type) {
            'leave_summary'      => $this->generateLeaveSummaryReport($financialYear, $request->department_id),
            'department_summary' => $this->generateDepartmentSummaryReport($financialYear),
            'employee_leave'     => $this->generateEmployeeLeaveReport($financialYear, $request->department_id),
        };

        $filename = sprintf(
            '%s_%s_%s.csv',
            $request->report_type,
            $financialYear,
            now()->format('Ymd_His')
        );

        $reportTypeLabel = match ($request->report_type) {
            'leave_summary'      => 'Leave Summary Report',
            'department_summary' => 'Department Summary Report',
            'employee_leave'     => 'Employee Leave Balance Report',
        };

        app(EmailService::class)->sendReportEmail(
            $requestingUser,
            $csvContent,
            $filename,
            $reportTypeLabel,
            $financialYear
        );

        return response()->json([
            'message'        => "Report generated and sent to {$request->email}.",
            'report_type'    => $request->report_type,
            'financial_year' => $financialYear,
            'filename'       => $filename,
        ]);
    }

    private function generateLeaveSummaryReport(string $year, ?int $departmentId): string
    {
        $query = LeaveRequest::with(['employee.user', 'employee.department', 'leaveType'])
            ->where('financial_year', $year);

        if ($departmentId) {
            $query->whereHas('employee', fn($q) => $q->where('department_id', $departmentId));
        }

        $rows = [['ID', 'Employee', 'Email', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Total Days', 'Status', 'Submitted Date']];

        foreach ($query->orderBy('created_at', 'desc')->get() as $r) {
            $rows[] = [
                $r->id,
                $r->employee->user->name,
                $r->employee->user->email,
                $r->employee->department?->name ?? 'N/A',
                $r->leaveType->name,
                $r->start_date->format('Y-m-d'),
                $r->end_date->format('Y-m-d'),
                $r->total_days,
                $r->status,
                $r->created_at->format('Y-m-d'),
            ];
        }

        return $this->toCsv($rows);
    }

    private function generateDepartmentSummaryReport(string $year): string
    {
        $employees = Employee::with([
            'user',
            'department',
            'leaveRequests' => fn($q) => $q->where('financial_year', $year),
        ])->get();

        $deptData = [];
        foreach ($employees as $emp) {
            $dept = $emp->department?->name ?? 'No Department';
            $deptData[$dept] ??= ['total' => 0, 'pending' => 0, 'approved' => 0, 'rejected' => 0, 'cancelled' => 0, 'days' => 0.0];

            foreach ($emp->leaveRequests as $r) {
                $deptData[$dept]['total']++;
                $deptData[$dept][$r->status]++;
                if ($r->status === 'approved') {
                    $deptData[$dept]['days'] += $r->total_days;
                }
            }
        }

        $rows = [['Department', 'Total Requests', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Total Days Approved']];
        foreach ($deptData as $dept => $d) {
            $rows[] = [$dept, $d['total'], $d['pending'], $d['approved'], $d['rejected'], $d['cancelled'], $d['days']];
        }

        return $this->toCsv($rows);
    }

    private function generateEmployeeLeaveReport(string $year, ?int $departmentId): string
    {
        $query = Employee::with([
            'user',
            'department',
            'leaveBalances' => fn($q) => $q->where('financial_year', $year)->with('leaveType'),
        ]);

        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        $rows = [['Employee', 'Email', 'Department', 'Leave Type', 'Entitled Days', 'Carried Over', 'Adjustment', 'Used Days', 'Pending Days', 'Available Balance']];

        foreach ($query->get() as $emp) {
            foreach ($emp->leaveBalances as $b) {
                $rows[] = [
                    $emp->user->name,
                    $emp->user->email,
                    $emp->department?->name ?? 'N/A',
                    $b->leaveType->name,
                    $b->entitled_days,
                    $b->carried_over,
                    $b->adjustment,
                    $b->used_days,
                    $b->pending_days,
                    $b->available_balance,
                ];
            }
        }

        return $this->toCsv($rows);
    }

    private function toCsv(array $rows): string
    {
        $handle = fopen('php://temp', 'r+');
        foreach ($rows as $row) {
            fputcsv($handle, array_map('strval', $row));
        }
        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);
        return $csv;
    }
}
