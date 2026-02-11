<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\EmployeeLeaveBalance;
use App\Models\LeaveType;
use App\Models\SystemSetting;

class LeaveBalanceService
{
    public function initializeBalancesForEmployee(Employee $employee, ?string $financialYear = null): void
    {
        $financialYear = $financialYear ?? SystemSetting::getFinancialYear();
        $leaveTypes = LeaveType::active()->get();

        foreach ($leaveTypes as $leaveType) {
            $entitledDays = $leaveType->getAllowanceForEmployeeType($employee->employee_type_id);

            EmployeeLeaveBalance::updateOrCreate(
                [
                    'employee_id' => $employee->id,
                    'leave_type_id' => $leaveType->id,
                    'financial_year' => $financialYear,
                ],
                [
                    'entitled_days' => $entitledDays,
                    'carried_over' => 0,
                    'adjustment' => 0,
                    'used_days' => 0,
                    'pending_days' => 0,
                ]
            );
        }
    }

    public function initializeBalancesForAllEmployees(?string $financialYear = null): int
    {
        $financialYear = $financialYear ?? SystemSetting::getFinancialYear();
        $employees = Employee::active()->get();
        $count = 0;

        foreach ($employees as $employee) {
            $this->initializeBalancesForEmployee($employee, $financialYear);
            $count++;
        }

        return $count;
    }

    public function carryForwardBalances(string $fromYear, string $toYear): int
    {
        $maxCarryForward = SystemSetting::get('max_carry_forward', 5);
        $count = 0;

        $balances = EmployeeLeaveBalance::where('financial_year', $fromYear)->get();

        foreach ($balances as $balance) {
            $remainingBalance = $balance->remaining_balance;
            $carryForward = min($remainingBalance, $maxCarryForward);

            if ($carryForward > 0) {
                $newBalance = EmployeeLeaveBalance::where('employee_id', $balance->employee_id)
                    ->where('leave_type_id', $balance->leave_type_id)
                    ->where('financial_year', $toYear)
                    ->first();

                if ($newBalance) {
                    $newBalance->update(['carried_over' => $carryForward]);
                    $count++;
                }
            }
        }

        return $count;
    }

    public function adjustBalance(
        Employee $employee,
        LeaveType $leaveType,
        float $adjustment,
        ?string $financialYear = null
    ): EmployeeLeaveBalance {
        $financialYear = $financialYear ?? SystemSetting::getFinancialYear();

        $balance = EmployeeLeaveBalance::firstOrCreate(
            [
                'employee_id' => $employee->id,
                'leave_type_id' => $leaveType->id,
                'financial_year' => $financialYear,
            ],
            [
                'entitled_days' => $leaveType->getAllowanceForEmployeeType($employee->employee_type_id),
                'carried_over' => 0,
                'used_days' => 0,
                'pending_days' => 0,
            ]
        );

        $balance->update([
            'adjustment' => $balance->adjustment + $adjustment,
        ]);

        return $balance->fresh();
    }

    public function getBalanceSummary(Employee $employee, ?string $financialYear = null): array
    {
        $financialYear = $financialYear ?? SystemSetting::getFinancialYear();

        $balances = $employee->leaveBalances()
            ->where('financial_year', $financialYear)
            ->with('leaveType')
            ->get();

        return $balances->map(function ($balance) {
            return [
                'leave_type' => $balance->leaveType->name,
                'leave_type_code' => $balance->leaveType->code,
                'color' => $balance->leaveType->color,
                'entitled' => $balance->entitled_days,
                'carried_over' => $balance->carried_over,
                'adjustment' => $balance->adjustment,
                'total_entitled' => $balance->total_entitled,
                'used' => $balance->used_days,
                'pending' => $balance->pending_days,
                'available' => $balance->available_balance,
                'remaining' => $balance->remaining_balance,
            ];
        })->toArray();
    }

    public function resetBalances(Employee $employee, ?string $financialYear = null): void
    {
        $financialYear = $financialYear ?? SystemSetting::getFinancialYear();

        EmployeeLeaveBalance::where('employee_id', $employee->id)
            ->where('financial_year', $financialYear)
            ->update([
                'used_days' => 0,
                'pending_days' => 0,
                'adjustment' => 0,
            ]);
    }
}
