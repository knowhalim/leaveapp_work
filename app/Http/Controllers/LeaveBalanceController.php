<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Employee;
use App\Models\EmployeeLeaveBalance;
use App\Models\LeaveType;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveBalanceController extends Controller
{
    public function index(Request $request)
    {
        $financialYear = $request->get('financial_year', SystemSetting::getFinancialYear());

        $balances = EmployeeLeaveBalance::with(['employee.user', 'employee.department', 'leaveType'])
            ->where('financial_year', $financialYear)
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/LeaveBalances/Index', [
            'balances' => $balances,
            'financialYear' => $financialYear,
            'leaveTypes' => LeaveType::active()->get(),
        ]);
    }

    public function show(Employee $employee)
    {
        $financialYear = SystemSetting::getFinancialYear();

        $balances = $employee->leaveBalances()
            ->where('financial_year', $financialYear)
            ->with('leaveType')
            ->get();

        $employee->load(['user', 'department', 'employeeType']);

        return Inertia::render('Admin/LeaveBalances/Show', [
            'employee' => $employee,
            'balances' => $balances,
            'financialYear' => $financialYear,
        ]);
    }

    public function adjust(Request $request, EmployeeLeaveBalance $balance)
    {
        $validated = $request->validate([
            'adjustment' => ['required', 'numeric'],
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $oldAdjustment = $balance->adjustment;
        $balance->update([
            'adjustment' => $balance->adjustment + $validated['adjustment'],
        ]);

        ActivityLog::log('balance.adjusted', $balance, [
            'old_adjustment' => $oldAdjustment,
            'new_adjustment' => $balance->adjustment,
            'change' => $validated['adjustment'],
            'reason' => $validated['reason'],
        ]);

        return back()->with('success', 'Leave balance adjusted successfully.');
    }

    public function reset(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'leave_type_id' => ['required', 'exists:leave_types,id'],
            'financial_year' => ['required', 'string'],
        ]);

        $balance = EmployeeLeaveBalance::where('employee_id', $employee->id)
            ->where('leave_type_id', $validated['leave_type_id'])
            ->where('financial_year', $validated['financial_year'])
            ->first();

        if ($balance) {
            $balance->update([
                'used_days' => 0,
                'pending_days' => 0,
                'adjustment' => 0,
            ]);

            ActivityLog::log('balance.reset', $balance);
        }

        return back()->with('success', 'Leave balance reset successfully.');
    }

    public function myBalances(Request $request)
    {
        $employee = $request->user()->employee;
        $financialYear = SystemSetting::getFinancialYear();

        if (!$employee) {
            return Inertia::render('Employee/LeaveBalances', [
                'error' => 'Employee profile not found.',
            ]);
        }

        $balances = $employee->leaveBalances()
            ->where('financial_year', $financialYear)
            ->with('leaveType')
            ->get();

        return Inertia::render('Employee/LeaveBalances', [
            'balances' => $balances,
            'financialYear' => $financialYear,
        ]);
    }

    public function bulkAdjustment()
    {
        $financialYear = SystemSetting::getFinancialYear();

        // Get unique positions from employees
        $positions = Employee::whereNotNull('position')
            ->distinct()
            ->pluck('position')
            ->filter()
            ->values();

        return Inertia::render('Admin/LeaveBalances/BulkAdjustment', [
            'roles' => ['employee', 'manager', 'admin', 'super_admin'],
            'positions' => $positions,
            'leaveTypes' => LeaveType::active()->get(),
            'departments' => \App\Models\Department::active()->get(),
            'employeeTypes' => \App\Models\EmployeeType::active()->get(),
            'financialYear' => $financialYear,
        ]);
    }

    public function processBulkAdjustment(Request $request)
    {
        $validated = $request->validate([
            'adjustment_value' => ['required', 'numeric', 'min:-10', 'max:10'],
            'leave_type_id' => ['required', 'exists:leave_types,id'],
            'role' => ['nullable', 'string'],
            'position' => ['nullable', 'string'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'employee_type_id' => ['nullable', 'exists:employee_types,id'],
            'adjustment_type' => ['required', 'in:add,set'],
            'field' => ['required', 'in:entitled_days,carried_over,adjustment'],
        ]);

        $financialYear = SystemSetting::getFinancialYear();

        // Build query to find matching employees
        $query = Employee::with('user');

        if (!empty($validated['role'])) {
            $query->whereHas('user', function ($q) use ($validated) {
                $q->where('role', $validated['role']);
            });
        }

        if (!empty($validated['position'])) {
            $query->where('position', 'like', '%' . $validated['position'] . '%');
        }

        if (!empty($validated['department_id'])) {
            $query->where('department_id', $validated['department_id']);
        }

        if (!empty($validated['employee_type_id'])) {
            $query->where('employee_type_id', $validated['employee_type_id']);
        }

        $employees = $query->get();
        $updatedCount = 0;

        foreach ($employees as $employee) {
            $balance = EmployeeLeaveBalance::firstOrCreate(
                [
                    'employee_id' => $employee->id,
                    'leave_type_id' => $validated['leave_type_id'],
                    'financial_year' => $financialYear,
                ],
                [
                    'entitled_days' => 0,
                    'carried_over' => 0,
                    'adjustment' => 0,
                    'used_days' => 0,
                    'pending_days' => 0,
                ]
            );

            $field = $validated['field'];
            $oldValue = $balance->$field;

            if ($validated['adjustment_type'] === 'add') {
                $balance->$field = $balance->$field + $validated['adjustment_value'];
            } else {
                $balance->$field = $validated['adjustment_value'];
            }

            $balance->save();
            $updatedCount++;

            ActivityLog::log('balance.bulk_adjusted', $balance, [
                'field' => $field,
                'old_value' => $oldValue,
                'new_value' => $balance->$field,
                'adjustment_type' => $validated['adjustment_type'],
            ]);
        }

        return back()->with('success', "Successfully updated {$updatedCount} employee leave balances.");
    }

    public function previewBulkAdjustment(Request $request)
    {
        $validated = $request->validate([
            'role' => ['nullable', 'string'],
            'position' => ['nullable', 'string'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'employee_type_id' => ['nullable', 'exists:employee_types,id'],
        ]);

        // Build query to find matching employees
        $query = Employee::with(['user', 'department', 'employeeType']);

        if (!empty($validated['role'])) {
            $query->whereHas('user', function ($q) use ($validated) {
                $q->where('role', $validated['role']);
            });
        }

        if (!empty($validated['position'])) {
            $query->where('position', 'like', '%' . $validated['position'] . '%');
        }

        if (!empty($validated['department_id'])) {
            $query->where('department_id', $validated['department_id']);
        }

        if (!empty($validated['employee_type_id'])) {
            $query->where('employee_type_id', $validated['employee_type_id']);
        }

        $employees = $query->limit(100)->get();

        return response()->json([
            'count' => $query->count(),
            'employees' => $employees->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'name' => $emp->user?->name,
                    'email' => $emp->user?->email,
                    'position' => $emp->position,
                    'department' => $emp->department?->name,
                    'employee_type' => $emp->employeeType?->name,
                    'role' => $emp->user?->role,
                ];
            }),
        ]);
    }
}
