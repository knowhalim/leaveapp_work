<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Employee;
use App\Models\EmployeeLeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\LeaveCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserApiController extends Controller
{
    public function __construct(protected LeaveCalculationService $calculationService) {}

    public function show(string $email)
    {
        $user = User::where('email', $email)->with('employee.department', 'employee.employeeType')->first();

        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => $user->is_active,
            'employee' => $user->employee ? [
                'id' => $user->employee->id,
                'employee_id' => $user->employee->employee_id,
                'department' => $user->employee->department?->name,
                'employee_type' => $user->employee->employeeType?->name,
                'date_joined' => $user->employee->date_joined,
                'phone' => $user->employee->phone,
            ] : null,
        ]);
    }

    public function balances(string $email)
    {
        $user = User::where('email', $email)->with('employee')->first();

        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        if (!$user->employee) {
            return response()->json(['error' => 'User has no employee record.'], 404);
        }

        $financialYear = SystemSetting::getFinancialYear();

        $balances = EmployeeLeaveBalance::where('employee_id', $user->employee->id)
            ->where('financial_year', $financialYear)
            ->with('leaveType')
            ->get()
            ->map(fn($b) => [
                'leave_type' => $b->leaveType->name,
                'leave_type_code' => $b->leaveType->code,
                'financial_year' => $b->financial_year,
                'entitled_days' => $b->entitled_days,
                'used_days' => $b->used_days,
                'pending_days' => $b->pending_days,
                'carried_forward' => $b->carried_forward,
                'available_balance' => $b->available_balance,
            ]);

        return response()->json([
            'email' => $email,
            'financial_year' => $financialYear,
            'balances' => $balances,
        ]);
    }

    public function applyLeave(Request $request, string $email)
    {
        $user = User::where('email', $email)->with('employee')->first();

        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        if (!$user->employee) {
            return response()->json(['error' => 'User has no employee record.'], 404);
        }

        $leaveType = LeaveType::find($request->leave_type_id);
        if (!$leaveType) {
            return response()->json(['error' => 'Invalid leave type.'], 422);
        }

        $validated = $request->validate([
            'leave_type_id' => ['required', 'exists:leave_types,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'start_half' => ['required', 'in:full,first_half,second_half'],
            'end_half' => ['required', 'in:full,first_half,second_half'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $employee = $user->employee;
        $financialYear = SystemSetting::getFinancialYear();

        $totalDays = $this->calculationService->calculateLeaveDays(
            $validated['start_date'],
            $validated['end_date'],
            $validated['start_half'],
            $validated['end_half']
        );

        $balance = EmployeeLeaveBalance::where('employee_id', $employee->id)
            ->where('leave_type_id', $leaveType->id)
            ->where('financial_year', $financialYear)
            ->first();

        if ($balance && $totalDays > $balance->available_balance) {
            return response()->json(['error' => 'Insufficient leave balance.'], 422);
        }

        $leaveRequest = DB::transaction(function () use ($validated, $employee, $totalDays, $financialYear, $balance) {
            $leaveRequest = LeaveRequest::create([
                'employee_id' => $employee->id,
                'leave_type_id' => $validated['leave_type_id'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'start_half' => $validated['start_half'],
                'end_half' => $validated['end_half'],
                'total_days' => $totalDays,
                'reason' => $validated['reason'] ?? null,
                'financial_year' => $financialYear,
                'status' => 'pending',
            ]);

            if ($balance) {
                $balance->increment('pending_days', $totalDays);
            }

            ActivityLog::log('leave.requested_via_api', $leaveRequest);

            return $leaveRequest;
        });

        return response()->json([
            'message' => 'Leave request submitted successfully.',
            'leave_request' => [
                'id' => $leaveRequest->id,
                'leave_type' => $leaveType->name,
                'start_date' => $leaveRequest->start_date,
                'end_date' => $leaveRequest->end_date,
                'total_days' => $leaveRequest->total_days,
                'status' => $leaveRequest->status,
            ],
        ], 201);
    }
}
