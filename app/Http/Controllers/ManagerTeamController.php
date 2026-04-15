<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeLeaveBalance;
use App\Models\LeaveRequest;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ManagerTeamController extends Controller
{
    private function getTeamEmployeeIds(): \Illuminate\Support\Collection
    {
        $user = auth()->user();
        $managedDepartmentIds = $user->managedDepartments()->pluck('id');
        $subordinateIds = $user->employee
            ? $user->employee->subordinates()->pluck('employees.id')
            : collect();

        return Employee::where(function ($q) use ($managedDepartmentIds, $subordinateIds) {
            $q->whereIn('department_id', $managedDepartmentIds)
                ->orWhereIn('id', $subordinateIds);
        })->pluck('id');
    }

    public function team(Request $request)
    {
        $financialYear = SystemSetting::getFinancialYear();
        $teamIds = $this->getTeamEmployeeIds();

        $upcomingLeave = LeaveRequest::with(['employee.user', 'leaveType'])
            ->whereIn('employee_id', $teamIds)
            ->approved()
            ->where('end_date', '>=', today())
            ->orderBy('start_date')
            ->get();

        $leaveHistory = LeaveRequest::with(['employee.user', 'leaveType', 'approver'])
            ->whereIn('employee_id', $teamIds)
            ->whereIn('status', ['approved', 'rejected', 'cancelled'])
            ->where('end_date', '<', today())
            ->latest('start_date')
            ->paginate(20)
            ->withQueryString();

        $leaveBalances = EmployeeLeaveBalance::with(['employee.user', 'leaveType'])
            ->whereIn('employee_id', $teamIds)
            ->where('financial_year', $financialYear)
            ->get()
            ->groupBy('employee_id');

        $teamMembers = Employee::whereIn('id', $teamIds)->with('user')->get();

        return Inertia::render('Manager/Team', [
            'upcomingLeave' => $upcomingLeave,
            'leaveHistory' => $leaveHistory,
            'leaveBalances' => $leaveBalances,
            'teamMembers' => $teamMembers,
            'financialYear' => $financialYear,
        ]);
    }
}
