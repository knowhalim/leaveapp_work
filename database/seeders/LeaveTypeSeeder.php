<?php

namespace Database\Seeders;

use App\Models\EmployeeType;
use App\Models\LeaveType;
use App\Models\LeaveTypeAllowance;
use Illuminate\Database\Seeder;

class LeaveTypeSeeder extends Seeder
{
    public function run(): void
    {
        $leaveTypes = [
            [
                'name' => 'Annual Leave',
                'code' => 'AL',
                'color' => '#3B82F6',
                'default_days' => 14,
                'max_days' => 21,
                'is_paid' => true,
                'requires_attachment' => false,
                'allows_half_day' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Sick Leave',
                'code' => 'SL',
                'color' => '#EF4444',
                'default_days' => 14,
                'max_days' => 60,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Personal Leave',
                'code' => 'PL',
                'color' => '#8B5CF6',
                'default_days' => 3,
                'max_days' => 5,
                'is_paid' => true,
                'requires_attachment' => false,
                'allows_half_day' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Compassionate Leave',
                'code' => 'CL',
                'color' => '#6B7280',
                'default_days' => 3,
                'max_days' => 5,
                'is_paid' => true,
                'requires_attachment' => false,
                'allows_half_day' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Maternity Leave',
                'code' => 'ML',
                'color' => '#EC4899',
                'default_days' => 60,
                'max_days' => 90,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Paternity Leave',
                'code' => 'PTL',
                'color' => '#14B8A6',
                'default_days' => 7,
                'max_days' => 14,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Unpaid Leave',
                'code' => 'UL',
                'color' => '#F59E0B',
                'default_days' => 0,
                'max_days' => 30,
                'is_paid' => false,
                'requires_attachment' => false,
                'allows_half_day' => true,
                'is_active' => true,
            ],
        ];

        foreach ($leaveTypes as $leaveTypeData) {
            LeaveType::create($leaveTypeData);
        }

        // Create allowances for each employee type
        $employeeTypes = EmployeeType::all();
        $leaveTypes = LeaveType::all();

        foreach ($leaveTypes as $leaveType) {
            foreach ($employeeTypes as $employeeType) {
                $daysAllowed = $leaveType->default_days;

                // Adjust for part-time and contract employees
                if ($employeeType->name === 'Part-Time') {
                    $daysAllowed = ceil($leaveType->default_days * 0.5);
                } elseif ($employeeType->name === 'Contract') {
                    $daysAllowed = ceil($leaveType->default_days * 0.75);
                } elseif ($employeeType->name === 'Intern') {
                    $daysAllowed = ceil($leaveType->default_days * 0.25);
                }

                LeaveTypeAllowance::create([
                    'leave_type_id' => $leaveType->id,
                    'employee_type_id' => $employeeType->id,
                    'days_allowed' => $daysAllowed,
                ]);
            }
        }
    }
}
