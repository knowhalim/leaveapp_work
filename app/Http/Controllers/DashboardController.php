<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function superAdmin(Request $request)
    {
        $financialYear = SystemSetting::getFinancialYear();

        $stats = [
            'totalEmployees' => Employee::active()->count(),
            'totalDepartments' => Department::active()->count(),
            'pendingRequests' => LeaveRequest::pending()->count(),
            'approvedToday' => LeaveRequest::approved()
                ->whereDate('approved_at', today())
                ->count(),
        ];

        $pendingRequests = LeaveRequest::with(['employee.user', 'leaveType'])
            ->pending()
            ->latest()
            ->take(10)
            ->get();

        $recentActivity = LeaveRequest::with(['employee.user', 'leaveType', 'approver'])
            ->whereIn('status', ['approved', 'rejected'])
            ->latest('approved_at')
            ->take(10)
            ->get();

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => $stats,
            'pendingRequests' => $pendingRequests,
            'recentActivity' => $recentActivity,
            'financialYear' => $financialYear,
        ]);
    }

    public function admin(Request $request)
    {
        $financialYear = SystemSetting::getFinancialYear();

        $stats = [
            'totalEmployees' => Employee::active()->count(),
            'totalDepartments' => Department::active()->count(),
            'pendingRequests' => LeaveRequest::pending()->count(),
            'approvedToday' => LeaveRequest::approved()
                ->whereDate('approved_at', today())
                ->count(),
        ];

        $pendingRequests = LeaveRequest::with(['employee.user', 'leaveType'])
            ->pending()
            ->latest()
            ->take(10)
            ->get();

        $departments = Department::withCount('employees')->active()->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'pendingRequests' => $pendingRequests,
            'departments' => $departments,
            'financialYear' => $financialYear,
        ]);
    }

    public function manager(Request $request)
    {
        $user = $request->user();
        $financialYear = SystemSetting::getFinancialYear();

        $managedDepartments = $user->managedDepartments()->pluck('id');

        $teamMembers = Employee::whereIn('department_id', $managedDepartments)
            ->with('user')
            ->active()
            ->get();

        $teamMemberIds = $teamMembers->pluck('id');

        $pendingRequests = LeaveRequest::with(['employee.user', 'leaveType'])
            ->whereIn('employee_id', $teamMemberIds)
            ->pending()
            ->latest()
            ->get();

        $todayOnLeave = LeaveRequest::with(['employee.user', 'leaveType'])
            ->whereIn('employee_id', $teamMemberIds)
            ->approved()
            ->where('start_date', '<=', today())
            ->where('end_date', '>=', today())
            ->get();

        $stats = [
            'teamSize' => $teamMembers->count(),
            'pendingRequests' => $pendingRequests->count(),
            'onLeaveToday' => $todayOnLeave->count(),
        ];

        return Inertia::render('Manager/Dashboard', [
            'stats' => $stats,
            'pendingRequests' => $pendingRequests,
            'todayOnLeave' => $todayOnLeave,
            'teamMembers' => $teamMembers,
            'financialYear' => $financialYear,
        ]);
    }

    public function employee(Request $request)
    {
        $user = $request->user();
        $employee = $user->employee;
        $financialYear = SystemSetting::getFinancialYear();

        if (!$employee) {
            return Inertia::render('Employee/Dashboard', [
                'error' => 'Employee profile not found.',
            ]);
        }

        $leaveBalances = $employee->leaveBalances()
            ->where('financial_year', $financialYear)
            ->with('leaveType')
            ->get();

        $recentRequests = $employee->leaveRequests()
            ->with('leaveType')
            ->latest()
            ->take(5)
            ->get();

        $pendingRequests = $employee->leaveRequests()
            ->pending()
            ->count();

        $upcomingLeave = $employee->leaveRequests()
            ->approved()
            ->where('start_date', '>', today())
            ->with('leaveType')
            ->orderBy('start_date')
            ->take(3)
            ->get();

        return Inertia::render('Employee/Dashboard', [
            'employee' => $employee->load(['department', 'employeeType']),
            'leaveBalances' => $leaveBalances,
            'recentRequests' => $recentRequests,
            'pendingRequests' => $pendingRequests,
            'upcomingLeave' => $upcomingLeave,
            'financialYear' => $financialYear,
        ]);
    }
}
