<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Employee;
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

        $leaveRequests = $query->latest()->paginate(20)->withQueryString();

        $summary = [
            'total' => LeaveRequest::where('financial_year', $financialYear)->count(),
            'approved' => LeaveRequest::where('financial_year', $financialYear)->where('status', 'approved')->count(),
            'pending' => LeaveRequest::where('financial_year', $financialYear)->where('status', 'pending')->count(),
            'rejected' => LeaveRequest::where('financial_year', $financialYear)->where('status', 'rejected')->count(),
        ];

        return Inertia::render('Admin/Reports/LeaveReport', [
            'leaveRequests' => $leaveRequests,
            'summary' => $summary,
            'departments' => Department::active()->get(),
            'leaveTypes' => LeaveType::active()->get(),
            'filters' => $request->only(['financial_year', 'department_id', 'leave_type_id', 'status']),
            'financialYear' => $financialYear,
        ]);
    }

    public function departmentReport(Request $request)
    {
        $financialYear = $request->get('financial_year', SystemSetting::getFinancialYear());

        $departments = Department::with('manager')
            ->withCount('employees')
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

        return Inertia::render('Admin/Reports/DepartmentReport', [
            'departments' => $departments,
            'financialYear' => $financialYear,
        ]);
    }

    public function employeeReport(Request $request)
    {
        $financialYear = $request->get('financial_year', SystemSetting::getFinancialYear());
        $departmentId = $request->get('department_id');

        $query = Employee::with(['user', 'department', 'employeeType', 'leaveBalances' => function ($q) use ($financialYear) {
            $q->where('financial_year', $financialYear)->with('leaveType');
        }])->active();

        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        $employees = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/Reports/EmployeeReport', [
            'employees' => $employees,
            'departments' => Department::active()->get(),
            'filters' => $request->only(['financial_year', 'department_id']),
            'financialYear' => $financialYear,
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

        return Inertia::render('Admin/Reports/LeaveTypeReport', [
            'leaveTypes' => $leaveTypes,
            'financialYear' => $financialYear,
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

        $data = match ($type) {
            'department' => $this->exportDepartmentData($financialYear),
            'employee' => $this->exportEmployeeData($financialYear),
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

    protected function exportEmployeeData(string $financialYear): array
    {
        return Employee::with(['user', 'department'])
            ->active()
            ->get()
            ->map(function ($employee) use ($financialYear) {
                $totalDays = LeaveRequest::where('employee_id', $employee->id)
                    ->where('financial_year', $financialYear)
                    ->where('status', 'approved')
                    ->sum('total_days');

                return [
                    'Employee' => $employee->user->name,
                    'Department' => $employee->department?->name ?? 'N/A',
                    'Total Leave Days' => $totalDays,
                ];
            })
            ->toArray();
    }
}
