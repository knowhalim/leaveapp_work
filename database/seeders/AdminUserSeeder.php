<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeType;
use App\Models\User;
use App\Services\LeaveBalanceService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $balanceService = new LeaveBalanceService();

        // Create Super Admin
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@hrleave.com',
            'password' => Hash::make('password'),
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        $hrDepartment = Department::where('name', 'Human Resources')->first();
        $fullTimeType = EmployeeType::where('name', 'Full-Time')->first();

        $superAdminEmployee = Employee::create([
            'user_id' => $superAdmin->id,
            'employee_number' => 'EMP001',
            'department_id' => $hrDepartment?->id,
            'employee_type_id' => $fullTimeType?->id,
            'position' => 'System Administrator',
            'hire_date' => now()->subYears(5),
        ]);

        $balanceService->initializeBalancesForEmployee($superAdminEmployee);

        // Create Admin
        $admin = User::create([
            'name' => 'HR Admin',
            'email' => 'admin@hrleave.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        $adminEmployee = Employee::create([
            'user_id' => $admin->id,
            'employee_number' => 'EMP002',
            'department_id' => $hrDepartment?->id,
            'employee_type_id' => $fullTimeType?->id,
            'position' => 'HR Manager',
            'hire_date' => now()->subYears(3),
        ]);

        $balanceService->initializeBalancesForEmployee($adminEmployee);

        // Update HR department manager
        if ($hrDepartment) {
            $hrDepartment->update(['manager_id' => $admin->id]);
        }

        // Create Manager
        $engineeringDept = Department::where('name', 'Engineering')->first();

        $manager = User::create([
            'name' => 'Engineering Manager',
            'email' => 'manager@hrleave.com',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'is_active' => true,
        ]);

        $managerEmployee = Employee::create([
            'user_id' => $manager->id,
            'employee_number' => 'EMP003',
            'department_id' => $engineeringDept?->id,
            'employee_type_id' => $fullTimeType?->id,
            'position' => 'Engineering Manager',
            'hire_date' => now()->subYears(2),
        ]);

        $balanceService->initializeBalancesForEmployee($managerEmployee);

        // Update Engineering department manager
        if ($engineeringDept) {
            $engineeringDept->update(['manager_id' => $manager->id]);
        }

        // Create Employee
        $employee = User::create([
            'name' => 'John Doe',
            'email' => 'employee@hrleave.com',
            'password' => Hash::make('password'),
            'role' => 'employee',
            'is_active' => true,
        ]);

        $employeeRecord = Employee::create([
            'user_id' => $employee->id,
            'employee_number' => 'EMP004',
            'department_id' => $engineeringDept?->id,
            'employee_type_id' => $fullTimeType?->id,
            'position' => 'Software Developer',
            'hire_date' => now()->subYear(),
        ]);

        $balanceService->initializeBalancesForEmployee($employeeRecord);

        // Set supervisor relationship
        if ($managerEmployee && $employeeRecord) {
            $employeeRecord->supervisors()->attach($managerEmployee->id, ['is_primary' => true]);
        }
    }
}
