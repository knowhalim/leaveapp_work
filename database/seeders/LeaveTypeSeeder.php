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
                'name' => 'Vacation Leave',
                'code' => 'VL',
                'color' => '#3B82F6',
                'default_days' => 14,
                'max_days' => 21,
                'is_paid' => true,
                'requires_attachment' => false,
                'allows_half_day' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Medical Leave',
                'code' => 'ML',
                'color' => '#EF4444',
                'default_days' => 14,
                'max_days' => 60,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Hospitalisation Leave',
                'code' => 'HL',
                'color' => '#DC2626',
                'default_days' => 60,
                'max_days' => 60,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Medical Leave (No MC)',
                'code' => 'MLNMC',
                'color' => '#F87171',
                'default_days' => 0,
                'max_days' => null,
                'is_paid' => true,
                'requires_attachment' => false,
                'allows_half_day' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Off-in-lieu Leave (Saturday Holiday)',
                'code' => 'OIL',
                'color' => '#6366F1',
                'default_days' => 0,
                'max_days' => null,
                'is_paid' => true,
                'requires_attachment' => false,
                'allows_half_day' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Work Injury Leave',
                'code' => 'WIL',
                'color' => '#B91C1C',
                'default_days' => 0,
                'max_days' => null,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Representative Games, International/Regional Cultural Activities and Singapore Volunteers Overseas Program',
                'code' => 'RGSVOP',
                'color' => '#0EA5E9',
                'default_days' => 0,
                'max_days' => null,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Examination Leave',
                'code' => 'EL',
                'color' => '#8B5CF6',
                'default_days' => 0,
                'max_days' => null,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Family Care Leave',
                'code' => 'FCL',
                'color' => '#D946EF',
                'default_days' => 0,
                'max_days' => null,
                'is_paid' => true,
                'requires_attachment' => false,
                'allows_half_day' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Marriage Leave',
                'code' => 'MRL',
                'color' => '#EC4899',
                'default_days' => 3,
                'max_days' => 3,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => false,
                'is_active' => true,
            ],
            [
                'name' => 'National Service Leave',
                'code' => 'NSL',
                'color' => '#059669',
                'default_days' => 0,
                'max_days' => null,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => false,
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
                'name' => 'Shared Parental Leave',
                'code' => 'SPL',
                'color' => '#F472B6',
                'default_days' => 0,
                'max_days' => null,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Maternity Leave',
                'code' => 'MTL',
                'color' => '#E11D48',
                'default_days' => 112,
                'max_days' => 112,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Maternity Leave (Flexi)',
                'code' => 'MTLF',
                'color' => '#FB7185',
                'default_days' => 112,
                'max_days' => 112,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Maternity Leave (Flexi) - NonSG',
                'code' => 'MTLFNS',
                'color' => '#FDA4AF',
                'default_days' => 56,
                'max_days' => 56,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Paternity Leave',
                'code' => 'PTL',
                'color' => '#14B8A6',
                'default_days' => 14,
                'max_days' => 14,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Paternity Leave - NonSG',
                'code' => 'PTLNS',
                'color' => '#5EEAD4',
                'default_days' => 7,
                'max_days' => 7,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => false,
                'is_active' => true,
            ],
            [
                'name' => 'ChildCare Leave - Conditional',
                'code' => 'CCLC',
                'color' => '#A78BFA',
                'default_days' => 6,
                'max_days' => 6,
                'is_paid' => true,
                'requires_attachment' => false,
                'allows_half_day' => true,
                'is_active' => true,
            ],
            [
                'name' => 'ChildCare Leave - Unconditional',
                'code' => 'CCLU',
                'color' => '#C084FC',
                'default_days' => 2,
                'max_days' => 2,
                'is_paid' => true,
                'requires_attachment' => false,
                'allows_half_day' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Additional unconditional childcare leave - non SG',
                'code' => 'AUCCL',
                'color' => '#DDD6FE',
                'default_days' => 2,
                'max_days' => 2,
                'is_paid' => true,
                'requires_attachment' => false,
                'allows_half_day' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Adoption Leave',
                'code' => 'ADL',
                'color' => '#F59E0B',
                'default_days' => 112,
                'max_days' => 112,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Adoption Leave (Flexi)',
                'code' => 'ADLF',
                'color' => '#FBBF24',
                'default_days' => 112,
                'max_days' => 112,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Adoption Leave - NonSG',
                'code' => 'ADLNS',
                'color' => '#FCD34D',
                'default_days' => 56,
                'max_days' => 56,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Adoption Leave - NonSG (Flexi)',
                'code' => 'ADLNSF',
                'color' => '#FDE68A',
                'default_days' => 56,
                'max_days' => 56,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Unpaid Infant Care Leave',
                'code' => 'UICL',
                'color' => '#78716C',
                'default_days' => 6,
                'max_days' => 6,
                'is_paid' => false,
                'requires_attachment' => false,
                'allows_half_day' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Trade Union Courses',
                'code' => 'TUC',
                'color' => '#0284C7',
                'default_days' => 0,
                'max_days' => null,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Volunteer Leave',
                'code' => 'VOL',
                'color' => '#16A34A',
                'default_days' => 0,
                'max_days' => null,
                'is_paid' => true,
                'requires_attachment' => false,
                'allows_half_day' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Shared Parental Leave NonSG',
                'code' => 'SPLNS',
                'color' => '#F9A8D4',
                'default_days' => 0,
                'max_days' => null,
                'is_paid' => true,
                'requires_attachment' => true,
                'allows_half_day' => false,
                'is_active' => true,
            ],
        ];

        foreach ($leaveTypes as $leaveTypeData) {
            LeaveType::updateOrCreate(
                ['code' => $leaveTypeData['code']],
                $leaveTypeData
            );
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

                LeaveTypeAllowance::updateOrCreate(
                    [
                        'leave_type_id' => $leaveType->id,
                        'employee_type_id' => $employeeType->id,
                    ],
                    ['days_allowed' => $daysAllowed]
                );
            }
        }
    }
}
