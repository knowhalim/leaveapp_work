<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeLeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use ZipArchive;

class ReportController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Reports/Index');
    }

    public function leaveReport(Request $request)
    {
        $financialYear = $request->get('financial_year', SystemSetting::getFinancialYear());
        $departmentId = $request->get('department_id');
        $leaveTypeId = $request->get('leave_type_id');
        $status = $request->get('status');
        $search = $request->get('search');
        $position = $request->get('position');
        $role = $request->get('role');

        $query = LeaveRequest::with(['employee.user', 'employee.department', 'leaveType', 'approver'])
            ->where('financial_year', $financialYear);

        if ($departmentId) {
            $query->whereHas('employee', fn ($q) => $q->where('department_id', $departmentId));
        }

        if ($leaveTypeId) {
            $query->where('leave_type_id', $leaveTypeId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($search) {
            $query->whereHas('employee.user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($position) {
            $query->whereHas('employee', fn ($q) => $q->where('position', 'like', "%{$position}%"));
        }

        if ($role && $role !== 'all') {
            $query->whereHas('employee.user', fn ($q) => $q->where('role', $role));
        }

        $leaveRequests = $query->latest()->paginate(20)->withQueryString();

        $summary = [
            'total' => LeaveRequest::where('financial_year', $financialYear)->count(),
            'approved' => LeaveRequest::where('financial_year', $financialYear)->where('status', 'approved')->count(),
            'pending' => LeaveRequest::where('financial_year', $financialYear)->where('status', 'pending')->count(),
            'rejected' => LeaveRequest::where('financial_year', $financialYear)->where('status', 'rejected')->count(),
        ];

        $positions = Employee::whereNotNull('position')
            ->where('position', '!=', '')
            ->select('position')
            ->distinct()
            ->orderBy('position')
            ->pluck('position');

        return Inertia::render('Admin/Reports/LeaveReport', [
            'leaveRequests' => $leaveRequests,
            'summary' => $summary,
            'departments' => Department::active()->get(),
            'leaveTypes' => LeaveType::active()->get(),
            'positions' => $positions,
            'filters' => $request->only(['financial_year', 'department_id', 'leave_type_id', 'status', 'search', 'position', 'role']),
            'financialYear' => $financialYear,
        ]);
    }

    public function departmentReport(Request $request)
    {
        $financialYear = $request->get('financial_year', SystemSetting::getFinancialYear());

        $departments = Department::withCount('employees')
            ->active()
            ->get()
            ->map(function ($department) use ($financialYear) {
                $employeeIds = $department->employees()->pluck('id');

                $department->leave_stats = [
                    'total_requests' => LeaveRequest::whereIn('employee_id', $employeeIds)
                        ->where('financial_year', $financialYear)
                        ->count(),
                    'approved' => LeaveRequest::whereIn('employee_id', $employeeIds)
                        ->where('financial_year', $financialYear)
                        ->where('status', 'approved')
                        ->count(),
                    'total_days_taken' => LeaveRequest::whereIn('employee_id', $employeeIds)
                        ->where('financial_year', $financialYear)
                        ->where('status', 'approved')
                        ->sum('total_days'),
                ];

                return $department;
            });

        $financialYears = LeaveRequest::select('financial_year')
            ->distinct()
            ->orderByDesc('financial_year')
            ->pluck('financial_year');

        // Fallback: if no leave requests exist yet, show current year only
        if ($financialYears->isEmpty()) {
            $financialYears = collect([$financialYear]);
        }

        return Inertia::render('Admin/Reports/DepartmentReport', [
            'departments' => $departments,
            'financialYear' => $financialYear,
            'financialYears' => $financialYears,
        ]);
    }

    public function employeeReport(Request $request)
    {
        $financialYear = $request->get('financial_year', SystemSetting::getFinancialYear());
        $departmentId = $request->get('department_id');
        $search = $request->get('search');
        $position = $request->get('position');
        $role = $request->get('role');

        $query = Employee::with(['user', 'department', 'employeeType', 'leaveBalances' => function ($q) use ($financialYear) {
            $q->where('financial_year', $financialYear)->with('leaveType');
        }])->active();

        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        if ($search) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($position) {
            $query->where('position', 'like', "%{$position}%");
        }

        if ($role && $role !== 'all') {
            $query->whereHas('user', fn ($q) => $q->where('role', $role));
        }

        $employees = $query->paginate(20)->withQueryString();

        $positions = Employee::whereNotNull('position')
            ->where('position', '!=', '')
            ->select('position')
            ->distinct()
            ->orderBy('position')
            ->pluck('position');

        $financialYears = EmployeeLeaveBalance::select('financial_year')
            ->distinct()
            ->orderByDesc('financial_year')
            ->pluck('financial_year');

        return Inertia::render('Admin/Reports/EmployeeReport', [
            'employees' => $employees,
            'departments' => Department::active()->get(),
            'positions' => $positions,
            'leaveTypes' => LeaveType::active()->orderBy('name')->get(['id', 'name', 'code', 'color']),
            'filters' => $request->only(['financial_year', 'department_id', 'search', 'position', 'role']),
            'financialYear' => $financialYear,
            'financialYears' => $financialYears,
        ]);
    }

    public function leaveTypeReport(Request $request)
    {
        $financialYear = $request->get('financial_year', SystemSetting::getFinancialYear());

        $leaveTypes = LeaveType::active()
            ->get()
            ->map(function ($leaveType) use ($financialYear) {
                $leaveType->stats = [
                    'total_requests' => LeaveRequest::where('leave_type_id', $leaveType->id)
                        ->where('financial_year', $financialYear)
                        ->count(),
                    'approved' => LeaveRequest::where('leave_type_id', $leaveType->id)
                        ->where('financial_year', $financialYear)
                        ->where('status', 'approved')
                        ->count(),
                    'total_days' => LeaveRequest::where('leave_type_id', $leaveType->id)
                        ->where('financial_year', $financialYear)
                        ->where('status', 'approved')
                        ->sum('total_days'),
                ];

                return $leaveType;
            });

        $financialYears = LeaveRequest::select('financial_year')
            ->distinct()
            ->orderByDesc('financial_year')
            ->pluck('financial_year');

        if ($financialYears->isEmpty()) {
            $financialYears = collect([$financialYear]);
        }

        return Inertia::render('Admin/Reports/LeaveTypeReport', [
            'leaveTypes' => $leaveTypes,
            'financialYear' => $financialYear,
            'financialYears' => $financialYears,
        ]);
    }

    public function export(Request $request)
    {
        $type = $request->get('type', 'leave');
        $financialYear = $request->get('financial_year', SystemSetting::getFinancialYear());

        // For leave export, create a ZIP with CSV and attachments
        if ($type === 'leave') {
            return $this->exportLeaveWithAttachments($financialYear);
        }

        $leaveTypeIds = $request->input('leave_type_ids', []);
        $userFilters = $request->only(['search', 'department_id', 'position', 'role']);

        $data = match ($type) {
            'department' => $this->exportDepartmentData($financialYear),
            'employee' => $this->exportEmployeeData($financialYear, $leaveTypeIds, $userFilters),
            'user_leave' => $this->exportUserLeaveData($financialYear, $leaveTypeIds, $userFilters),
            default => [],
        };

        $filename = "{$type}_report_{$financialYear}.csv";

        return response()->streamDownload(function () use ($data) {
            $output = fopen('php://output', 'w');

            if (!empty($data)) {
                fputcsv($output, array_keys($data[0]));
                foreach ($data as $row) {
                    fputcsv($output, $row);
                }
            }

            fclose($output);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    protected function exportLeaveWithAttachments(string $financialYear)
    {
        $leaveRequests = LeaveRequest::with(['employee.user', 'employee.department', 'leaveType', 'approver'])
            ->where('financial_year', $financialYear)
            ->orderBy('created_at', 'asc')
            ->get();

        $zipFileName = "leave_report_{$financialYear}_" . now()->format('Ymd_His') . ".zip";
        $zipPath = storage_path("app/temp/{$zipFileName}");

        // Ensure temp directory exists
        if (!file_exists(storage_path('app/temp'))) {
            mkdir(storage_path('app/temp'), 0755, true);
        }

        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return back()->with('error', 'Could not create export file.');
        }

        // Build CSV data with both online and local attachment paths
        $csvData = [];
        $attachmentIndex = 1;

        foreach ($leaveRequests as $index => $leave) {
            $onlineLink = '';
            $localPath = '';

            if ($leave->attachment_path && Storage::disk('public')->exists($leave->attachment_path)) {
                $employeeNumber = $leave->employee->employee_number ?? 'unknown';
                $originalExtension = pathinfo($leave->attachment_path, PATHINFO_EXTENSION);
                $attachmentFileName = "attachment_{$attachmentIndex}.{$originalExtension}";
                $relativePath = "attachments/{$employeeNumber}/{$attachmentFileName}";

                // Add file to ZIP
                $fileContent = Storage::disk('public')->get($leave->attachment_path);
                $zip->addFromString($relativePath, $fileContent);

                // Online link (live URL)
                $onlineLink = url('leaves/' . $leave->id . '/attachment');

                // Local path (relative path in ZIP)
                $localPath = $relativePath;

                $attachmentIndex++;
            }

            $csvData[] = [
                'Timestamp' => $leave->created_at->format('n/j/Y G:i:s'),
                'Name' => $leave->employee->user->name,
                'Email Address' => $leave->employee->user->email,
                'Employee Number' => $leave->employee->employee_number ?? '',
                'NRIC' => $leave->employee->nric ?? '',
                'I am applying for' => $leave->leaveType->name,
                'Start Date of Leave' => $leave->start_date->format('n/j/Y'),
                'End Date of Leave' => $leave->end_date->format('n/j/Y'),
                'Duration (days)' => $leave->total_days,
                'Reason/Notes' => $leave->reason ?? '',
                'Approver Email' => $leave->approver?->email ?? '',
                'Attachment (Online)' => $onlineLink,
                'Attachment (Local)' => $localPath,
                'Request #' => $index + 1,
                'Overall Status' => ucfirst($leave->status),
            ];
        }

        // Create CSV content
        $csvContent = '';
        if (!empty($csvData)) {
            $output = fopen('php://temp', 'r+');
            fputcsv($output, array_keys($csvData[0]));
            foreach ($csvData as $row) {
                fputcsv($output, $row);
            }
            rewind($output);
            $csvContent = stream_get_contents($output);
            fclose($output);
        }

        // Add CSV to ZIP
        $zip->addFromString("leave_report_{$financialYear}.csv", $csvContent);
        $zip->close();

        // Return ZIP file and delete after sending
        return response()->download($zipPath, $zipFileName, [
            'Content-Type' => 'application/zip',
        ])->deleteFileAfterSend(true);
    }

    protected function exportLeaveData(string $financialYear): array
    {
        return LeaveRequest::with(['employee.user', 'employee.department', 'leaveType', 'approver'])
            ->where('financial_year', $financialYear)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn ($leave, $index) => [
                'Timestamp' => $leave->created_at->format('n/j/Y G:i:s'),
                'Name' => $leave->employee->user->name,
                'Email Address' => $leave->employee->user->email,
                'NRIC' => $leave->employee->nric ?? '',
                'I am applying for' => $leave->leaveType->name,
                'Start Date of Leave' => $leave->start_date->format('n/j/Y'),
                'End Date of Leave' => $leave->end_date->format('n/j/Y'),
                'Duration (days)' => $leave->total_days,
                'Reason/Notes' => $leave->reason ?? '',
                'Approver Email' => $leave->approver?->email ?? '',
                'Attachment' => $leave->attachment_path ? url('leaves/' . $leave->id . '/attachment') : '',
                'Request #' => $index + 1,
                'Overall Status' => ucfirst($leave->status),
            ])
            ->toArray();
    }

    protected function exportDepartmentData(string $financialYear): array
    {
        return Department::withCount('employees')
            ->active()
            ->get()
            ->map(function ($department) use ($financialYear) {
                $employeeIds = $department->employees()->pluck('id');
                $totalDays = LeaveRequest::whereIn('employee_id', $employeeIds)
                    ->where('financial_year', $financialYear)
                    ->where('status', 'approved')
                    ->sum('total_days');

                return [
                    'Department' => $department->name,
                    'Employees' => $department->employees_count,
                    'Total Leave Days' => $totalDays,
                ];
            })
            ->toArray();
    }

    protected function exportEmployeeData(string $financialYear, array $leaveTypeIds = [], array $filters = []): array
    {
        $query = LeaveType::active()->orderBy('name');
        if (!empty($leaveTypeIds)) {
            $query->whereIn('id', $leaveTypeIds);
        }
        $leaveTypes = $query->get();

        $empQuery = Employee::with([
            'user',
            'department',
            'employeeType',
            'leaveBalances' => function ($q) use ($financialYear) {
                $q->where('financial_year', $financialYear)->with('leaveType');
            },
        ])->active();

        if (!empty($filters['department_id'])) {
            $empQuery->where('department_id', $filters['department_id']);
        }
        if (!empty($filters['search'])) {
            $empQuery->whereHas('user', function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                  ->orWhere('email', 'like', "%{$filters['search']}%");
            });
        }
        if (!empty($filters['position'])) {
            $empQuery->where('position', 'like', "%{$filters['position']}%");
        }
        if (!empty($filters['role']) && $filters['role'] !== 'all') {
            $empQuery->whereHas('user', fn ($q) => $q->where('role', $filters['role']));
        }

        $employees = $empQuery->get();

        return $employees->map(function ($employee) use ($leaveTypes) {
            // Index this employee's balances by leave_type_id for fast lookup
            $balancesByTypeId = $employee->leaveBalances->keyBy('leave_type_id');

            $row = [
                'Name' => $employee->user->name,
                'Employee ID' => $employee->employee_number ?? '',
                'Email' => $employee->user->email,
                'Department' => $employee->department?->name ?? 'N/A',
                'Employee Type' => $employee->employeeType?->name ?? 'N/A',
                'Position' => $employee->position ?? '',
                'Role' => ucfirst(str_replace('_', ' ', $employee->user->role)),
            ];

            foreach ($leaveTypes as $lt) {
                $balance = $balancesByTypeId->get($lt->id);
                if ($balance) {
                    $entitled = $balance->entitled_days + $balance->carried_over + $balance->adjustment;
                    $used = $balance->used_days;
                    $available = $entitled - $used - $balance->pending_days;
                    $row["{$lt->name} - Entitled"] = $entitled;
                    $row["{$lt->name} - Used"] = $used;
                    $row["{$lt->name} - Available"] = $available;
                } else {
                    $row["{$lt->name} - Entitled"] = '';
                    $row["{$lt->name} - Used"] = '';
                    $row["{$lt->name} - Available"] = '';
                }
            }

            return $row;
        })->toArray();
    }

    protected function exportUserLeaveData(string $financialYear, array $leaveTypeIds = [], array $filters = []): array
    {
        $query = LeaveType::active()->orderBy('name');
        if (!empty($leaveTypeIds)) {
            $query->whereIn('id', $leaveTypeIds);
        }
        $leaveTypes = $query->get();

        // Eager-load all approved leave requests grouped by employee + leave type
        $allRequests = LeaveRequest::with('leaveType')
            ->where('financial_year', $financialYear)
            ->where('status', 'approved')
            ->orderBy('start_date')
            ->get()
            ->groupBy('employee_id');

        $empQuery = Employee::with(['user', 'department', 'employeeType'])
            ->active()
            ->orderBy('id');

        if (!empty($filters['department_id'])) {
            $empQuery->where('department_id', $filters['department_id']);
        }
        if (!empty($filters['search'])) {
            $empQuery->whereHas('user', function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                  ->orWhere('email', 'like', "%{$filters['search']}%");
            });
        }
        if (!empty($filters['position'])) {
            $empQuery->where('position', 'like', "%{$filters['position']}%");
        }
        if (!empty($filters['role']) && $filters['role'] !== 'all') {
            $empQuery->whereHas('user', fn ($q) => $q->where('role', $filters['role']));
        }

        $employees = $empQuery->get();

        $rows = [];
        $sn = 1;

        foreach ($employees as $employee) {
            $empRequests = $allRequests->get($employee->id, collect());
            $byType = $empRequests->groupBy('leave_type_id');

            $row = [
                'S/N'  => $sn++,
                'Name' => $employee->user->name,
            ];

            foreach ($leaveTypes as $lt) {
                $requests = $byType->get($lt->id, collect());
                $daysTaken = $requests->sum('total_days');

                $dates = $requests->map(fn ($req) => $this->formatLeaveDateRange($req))->implode(', ');

                $row["{$lt->name} Taken (Days)"] = $daysTaken > 0 ? $daysTaken : '-';
                $row["{$lt->name} Dates"]        = $dates ?: '-';
            }

            $rows[] = $row;
        }

        return $rows;
    }

    private function formatLeaveDateRange(LeaveRequest $req): string
    {
        $start = $req->start_date;
        $end   = $req->end_date;
        $days  = $req->total_days;

        if ($start->equalTo($end)) {
            // Single day — no day count suffix
            return $start->format('d-M-y');
        }

        if ($start->format('M y') === $end->format('M y')) {
            // Same month: "19-20 May 25 (2 days)"
            return $start->format('d') . '-' . $end->format('d M y') . " ({$days} days)";
        }

        // Different months: "30-Sep-25 to 02-Oct-25 (3 days)"
        return $start->format('d-M-y') . ' to ' . $end->format('d-M-y') . " ({$days} days)";
    }
}
