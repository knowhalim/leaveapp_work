<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeType;
use App\Models\User;
use App\Services\EmailService;
use App\Services\LeaveBalanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('employee.department', 'employee.employeeType');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        if ($request->has('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $users = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'status']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Users/Create', [
            'departments' => Department::active()->get(),
            'employeeTypes' => EmployeeType::active()->get(),
            'roles' => ['employee', 'manager', 'admin', 'super_admin'],
        ]);
    }

    public function store(Request $request, LeaveBalanceService $balanceService, EmailService $emailService)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['employee', 'manager', 'admin', 'super_admin'])],
            'is_active' => ['boolean'],
            'employee_number' => ['required', 'string', 'unique:employees,employee_number'],
            'nric' => ['nullable', 'string', 'max:20', 'unique:employees,nric'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'employee_type_id' => ['nullable', 'exists:employee_types,id'],
            'position' => ['nullable', 'string', 'max:255'],
            'hire_date' => ['nullable', 'date'],
            'phone' => ['nullable', 'string', 'max:20'],
            'send_welcome_email' => ['boolean'],
        ]);

        $plainPassword = $validated['password'];
        $sendWelcomeEmail = $validated['send_welcome_email'] ?? true;

        $user = DB::transaction(function () use ($validated, $balanceService, $plainPassword) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($plainPassword),
                'role' => $validated['role'],
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $employee = Employee::create([
                'user_id' => $user->id,
                'employee_number' => $validated['employee_number'],
                'nric' => $validated['nric'] ?? null,
                'department_id' => $validated['department_id'] ?? null,
                'employee_type_id' => $validated['employee_type_id'] ?? null,
                'position' => $validated['position'] ?? null,
                'hire_date' => $validated['hire_date'] ?? null,
                'phone' => $validated['phone'] ?? null,
            ]);

            $balanceService->initializeBalancesForEmployee($employee);

            ActivityLog::log('user.created', $user, [
                'created_by' => auth()->id(),
            ]);

            return $user;
        });

        if ($sendWelcomeEmail) {
            $emailService->sendWelcomeEmail($user, $plainPassword);
        }

        return redirect()->route('users.index')
            ->with('success', 'User created successfully.');
    }

    public function show(User $user)
    {
        $user->load('employee.department', 'employee.employeeType', 'employee.leaveBalances.leaveType');

        return Inertia::render('Admin/Users/Show', [
            'user' => $user,
        ]);
    }

    public function edit(User $user)
    {
        $user->load('employee.leaveBalances.leaveType');

        $financialYear = \App\Models\SystemSetting::getFinancialYear();
        $leaveTypes = \App\Models\LeaveType::active()->get();

        // Get or create leave balances for all active leave types
        $balances = [];
        if ($user->employee) {
            foreach ($leaveTypes as $leaveType) {
                $balance = $user->employee->leaveBalances
                    ->where('leave_type_id', $leaveType->id)
                    ->where('financial_year', $financialYear)
                    ->first();

                $balances[] = [
                    'leave_type_id' => $leaveType->id,
                    'leave_type_name' => $leaveType->name,
                    'leave_type_code' => $leaveType->code,
                    'leave_type_color' => $leaveType->color,
                    'entitled_days' => $balance?->entitled_days ?? $leaveType->default_days,
                    'carried_over' => $balance?->carried_over ?? 0,
                    'adjustment' => $balance?->adjustment ?? 0,
                    'used_days' => $balance?->used_days ?? 0,
                    'pending_days' => $balance?->pending_days ?? 0,
                    'balance_id' => $balance?->id,
                ];
            }
        }

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
            'departments' => Department::active()->get(),
            'employeeTypes' => EmployeeType::active()->get(),
            'roles' => ['employee', 'manager', 'admin', 'super_admin'],
            'leaveBalances' => $balances,
            'financialYear' => $financialYear,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', Rule::in(['employee', 'manager', 'admin', 'super_admin'])],
            'is_active' => ['boolean'],
            'employee_number' => ['required', 'string', Rule::unique('employees')->ignore($user->employee?->id)],
            'nric' => ['nullable', 'string', 'max:20', Rule::unique('employees')->ignore($user->employee?->id)],
            'department_id' => ['nullable', 'exists:departments,id'],
            'employee_type_id' => ['nullable', 'exists:employee_types,id'],
            'position' => ['nullable', 'string', 'max:255'],
            'hire_date' => ['nullable', 'date'],
            'phone' => ['nullable', 'string', 'max:20'],
            'leave_balances' => ['nullable', 'array'],
            'leave_balances.*.leave_type_id' => ['required', 'exists:leave_types,id'],
            'leave_balances.*.entitled_days' => ['required', 'numeric', 'min:0'],
            'leave_balances.*.carried_over' => ['required', 'numeric', 'min:0'],
            'leave_balances.*.adjustment' => ['required', 'numeric'],
        ]);

        DB::transaction(function () use ($validated, $user) {
            $userData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'role' => $validated['role'],
                'is_active' => $validated['is_active'] ?? true,
            ];

            if (!empty($validated['password'])) {
                $userData['password'] = Hash::make($validated['password']);
            }

            $user->update($userData);

            if ($user->employee) {
                $user->employee->update([
                    'employee_number' => $validated['employee_number'],
                    'nric' => $validated['nric'],
                    'department_id' => $validated['department_id'],
                    'employee_type_id' => $validated['employee_type_id'],
                    'position' => $validated['position'],
                    'hire_date' => $validated['hire_date'],
                    'phone' => $validated['phone'],
                ]);

                // Update leave balances
                if (!empty($validated['leave_balances'])) {
                    $financialYear = \App\Models\SystemSetting::getFinancialYear();

                    foreach ($validated['leave_balances'] as $balanceData) {
                        \App\Models\EmployeeLeaveBalance::updateOrCreate(
                            [
                                'employee_id' => $user->employee->id,
                                'leave_type_id' => $balanceData['leave_type_id'],
                                'financial_year' => $financialYear,
                            ],
                            [
                                'entitled_days' => $balanceData['entitled_days'],
                                'carried_over' => $balanceData['carried_over'],
                                'adjustment' => $balanceData['adjustment'],
                            ]
                        );
                    }
                }
            }

            ActivityLog::log('user.updated', $user);
        });

        return redirect()->route('users.index')
            ->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        ActivityLog::log('user.deleted', $user, [
            'deleted_by' => auth()->id(),
            'user_email' => $user->email,
        ]);

        $user->delete();

        return redirect()->route('users.index')
            ->with('success', 'User deleted successfully.');
    }

    public function toggleStatus(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot deactivate your own account.');
        }

        $user->update(['is_active' => !$user->is_active]);

        ActivityLog::log($user->is_active ? 'user.activated' : 'user.deactivated', $user);

        return back()->with('success', 'User status updated successfully.');
    }
}
