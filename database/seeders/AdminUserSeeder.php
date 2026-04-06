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

        // Get admin credentials from environment or use defaults
        $adminName = env('ADMIN_NAME', 'Super Admin');
        $adminEmail = env('ADMIN_EMAIL', 'admin@example.com');
        $adminPassword = env('ADMIN_PASSWORD', 'password');

        // Create Super Admin
        $superAdmin = User::create([
            'name' => $adminName,
            'email' => $adminEmail,
            'password' => Hash::make($adminPassword),
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
    }
}
