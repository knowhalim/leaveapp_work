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
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    private function getEligibleSupervisors(): array
    {
        return Employee::whereHas('user', function ($q) {
            $q->where('is_active', true)
                ->whereIn('role', ['manager', 'admin', 'super_admin']);
        })
            ->with(['user', 'department'])
            ->get()
            ->map(fn ($emp) => [
                'id' => $emp->id,
                'user_id' => $emp->user_id,
                'name' => $emp->user->name,
                'email' => $emp->user->email,
                'role' => $emp->user->role,
                'department' => $emp->department?->name,
            ])
            ->values()
            ->toArray();
    }

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

    private function allowedRoles(): array
    {
        return auth()->user()->role === 'admin'
            ? ['employee', 'manager', 'admin']
            : ['employee', 'manager', 'admin', 'super_admin'];
    }

    public function create()
    {
        return Inertia::render('Admin/Users/Create', [
            'departments' => Department::active()->get(),
            'employeeTypes' => EmployeeType::active()->get(),
            'roles' => $this->allowedRoles(),
            'availableSupervisors' => $this->getEligibleSupervisors(),
        ]);
    }

    public function store(Request $request, LeaveBalanceService $balanceService, EmailService $emailService)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in($this->allowedRoles())],
            'is_active' => ['boolean'],
            'employee_number' => ['required', 'string', 'unique:employees,employee_number'],
            'nric' => ['nullable', 'string', 'max:20', 'unique:employees,nric'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'employee_type_id' => ['nullable', 'exists:employee_types,id'],
            'position' => ['nullable', 'string', 'max:255'],
            'hire_date' => ['nullable', 'date'],
            'phone' => ['nullable', 'string', 'max:20'],
            'send_welcome_email' => ['boolean'],
            'supervisors' => ['nullable', 'array'],
            'supervisors.*.id' => ['required', 'exists:employees,id'],
            'supervisors.*.is_primary' => ['boolean'],
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

            // Sync supervisors
            if (!empty($validated['supervisors'])) {
                $syncData = [];
                foreach ($validated['supervisors'] as $sup) {
                    $syncData[$sup['id']] = ['is_primary' => $sup['is_primary'] ?? false];
                }
                $employee->supervisors()->sync($syncData);
            }

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
        $user->load('employee.department', 'employee.employeeType', 'employee.leaveBalances.leaveType', 'employee.supervisors.user', 'employee.supervisors.department');

        return Inertia::render('Admin/Users/Show', [
            'user' => $user,
        ]);
    }

    public function edit(User $user)
    {
        if (auth()->user()->role === 'admin') {
            if ($user->role === 'super_admin') {
                abort(403, 'Admins cannot modify super admin accounts.');
            }
            if ($user->role === 'admin' && $user->id !== auth()->id()) {
                abort(403, 'Admins cannot modify other admin accounts.');
            }
        }

        $user->load('employee.leaveBalances.leaveType', 'employee.supervisors.user', 'employee.supervisors.department');

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

        $currentSupervisors = $user->employee?->supervisors->map(fn ($sup) => [
            'id' => $sup->id,
            'user_id' => $sup->user_id,
            'name' => $sup->user->name,
            'email' => $sup->user->email,
            'role' => $sup->user->role,
            'department' => $sup->department?->name,
            'is_primary' => (bool) $sup->pivot->is_primary,
        ])->values()->toArray() ?? [];

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
            'departments' => Department::active()->get(),
            'employeeTypes' => EmployeeType::active()->get(),
            'roles' => $this->allowedRoles(),
            'leaveBalances' => $balances,
            'financialYear' => $financialYear,
            'availableSupervisors' => $this->getEligibleSupervisors(),
            'currentSupervisors' => $currentSupervisors,
        ]);
    }

    public function update(Request $request, User $user)
    {
        if (auth()->user()->role === 'admin') {
            if ($user->role === 'super_admin') {
                abort(403, 'Admins cannot modify super admin accounts.');
            }
            if ($user->role === 'admin' && $user->id !== auth()->id()) {
                abort(403, 'Admins cannot modify other admin accounts.');
            }
            if ($user->id === auth()->id() && $request->input('role') !== $user->role) {
                abort(403, 'Admins cannot change their own role.');
            }
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', Rule::in($this->allowedRoles())],
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
            'supervisors' => ['nullable', 'array'],
            'supervisors.*.id' => ['required', 'exists:employees,id'],
            'supervisors.*.is_primary' => ['boolean'],
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

                // Sync supervisors
                $syncData = [];
                if (!empty($validated['supervisors'])) {
                    foreach ($validated['supervisors'] as $sup) {
                        $syncData[$sup['id']] = ['is_primary' => $sup['is_primary'] ?? false];
                    }
                }
                $user->employee->supervisors()->sync($syncData);
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

        if (auth()->user()->role === 'admin') {
            if ($user->role === 'super_admin') {
                return back()->with('error', 'Admins cannot delete super admin accounts.');
            }
            if ($user->role === 'admin' && $user->id !== auth()->id()) {
                return back()->with('error', 'Admins cannot delete other admin accounts.');
            }
        }

        ActivityLog::log('user.deleted', $user, [
            'deleted_by' => auth()->id(),
            'user_email' => $user->email,
        ]);

        $user->delete();

        return redirect()->route('users.index')
            ->with('success', 'User deleted successfully.');
    }

    public function batchImport()
    {
        return Inertia::render('Admin/Users/BatchImport', [
            'availableSupervisors' => $this->getEligibleSupervisors(),
            'departments' => Department::active()->pluck('name')->toArray(),
            'employeeTypes' => EmployeeType::active()->pluck('name')->toArray(),
        ]);
    }

    public function processBatchImport(Request $request, LeaveBalanceService $balanceService, EmailService $emailService)
    {
        $user = auth()->user();
        $isAdmin = in_array($user->role, ['super_admin', 'admin']);

        $rules = [
            'csv_file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
            'send_welcome_emails' => ['nullable'],
        ];

        if ($isAdmin) {
            $rules['supervisor_id'] = ['required', 'exists:employees,id'];
        }

        $request->validate($rules);

        $file = $request->file('csv_file');
        $handle = fopen($file->getRealPath(), 'r');

        if ($handle === false) {
            return back()->with('error', 'Could not read the CSV file.');
        }

        // Read header row
        $headers = fgetcsv($handle);
        if ($headers === false) {
            fclose($handle);
            return back()->with('error', 'CSV file is empty.');
        }

        // Normalize headers (trim whitespace, lowercase)
        $headers = array_map(fn ($h) => strtolower(trim($h)), $headers);

        $requiredHeaders = ['name', 'email', 'employee_number'];
        $missingHeaders = array_diff($requiredHeaders, $headers);
        if (!empty($missingHeaders)) {
            fclose($handle);
            return back()->with('error', 'Missing required columns: ' . implode(', ', $missingHeaders));
        }

        // Build lookup maps
        $departmentMap = Department::active()->pluck('id', 'name')
            ->mapWithKeys(fn ($id, $name) => [strtolower($name) => $id])
            ->toArray();

        $employeeTypeMap = EmployeeType::active()->pluck('id', 'name')
            ->mapWithKeys(fn ($id, $name) => [strtolower($name) => $id])
            ->toArray();

        // Determine supervisor
        if ($isAdmin) {
            $supervisorId = (int) $request->input('supervisor_id');
        } else {
            $supervisorId = $user->employee?->id;
            if (!$supervisorId) {
                fclose($handle);
                return back()->with('error', 'Your account does not have an employee profile to act as supervisor.');
            }
        }

        $rawSendEmails = $request->input('send_welcome_emails', 'true');
        $sendEmails = filter_var($rawSendEmails, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true;
        $successCount = 0;
        $errors = [];
        $rowNumber = 1; // header was row 1

        // Pre-load existing emails and employee numbers for uniqueness checks
        $existingEmails = User::pluck('email')->map(fn ($e) => strtolower($e))->toArray();
        $existingEmpNumbers = Employee::pluck('employee_number')->toArray();
        $existingNrics = Employee::whereNotNull('nric')->pluck('nric')->toArray();

        $createdUsers = []; // Store [user, plainPassword] for emails after commit

        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;

            // Skip empty rows
            if (count($row) === 1 && empty(trim($row[0]))) {
                continue;
            }

            // Map row to associative array
            $data = [];
            foreach ($headers as $i => $header) {
                $data[$header] = isset($row[$i]) ? trim($row[$i]) : '';
            }

            // Validate required fields
            $rowErrors = [];
            if (empty($data['name'])) {
                $rowErrors[] = 'Name is required';
            }
            if (empty($data['email'])) {
                $rowErrors[] = 'Email is required';
            } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                $rowErrors[] = 'Invalid email format';
            } elseif (in_array(strtolower($data['email']), $existingEmails)) {
                $rowErrors[] = 'Email already exists';
            }
            if (empty($data['employee_number'])) {
                $rowErrors[] = 'Employee number is required';
            } elseif (in_array($data['employee_number'], $existingEmpNumbers)) {
                $rowErrors[] = 'Employee number already exists';
            }

            // Check NRIC uniqueness if provided
            $nric = $data['nric'] ?? '';
            if (!empty($nric) && in_array($nric, $existingNrics)) {
                $rowErrors[] = 'NRIC already exists';
            }

            if (!empty($rowErrors)) {
                $errors[] = ['row' => $rowNumber, 'message' => implode('; ', $rowErrors)];
                continue;
            }

            // Resolve department
            $departmentId = null;
            if (!empty($data['department'])) {
                $departmentId = $departmentMap[strtolower($data['department'])] ?? null;
                if ($departmentId === null) {
                    $errors[] = ['row' => $rowNumber, 'message' => "Department '{$data['department']}' not found"];
                    continue;
                }
            }

            // Resolve employee type
            $employeeTypeId = null;
            if (!empty($data['employee_type'])) {
                $employeeTypeId = $employeeTypeMap[strtolower($data['employee_type'])] ?? null;
                if ($employeeTypeId === null) {
                    $errors[] = ['row' => $rowNumber, 'message' => "Employee type '{$data['employee_type']}' not found"];
                    continue;
                }
            }

            // Create user + employee in transaction
            $plainPassword = Str::random(10);

            try {
                $newUser = DB::transaction(function () use ($data, $plainPassword, $departmentId, $employeeTypeId, $supervisorId, $balanceService, $nric) {
                    $newUser = User::create([
                        'name' => $data['name'],
                        'email' => $data['email'],
                        'password' => Hash::make($plainPassword),
                        'role' => 'employee',
                        'is_active' => true,
                    ]);

                    $employee = Employee::create([
                        'user_id' => $newUser->id,
                        'employee_number' => $data['employee_number'],
                        'nric' => !empty($nric) ? $nric : null,
                        'department_id' => $departmentId,
                        'employee_type_id' => $employeeTypeId,
                        'position' => !empty($data['position']) ? $data['position'] : null,
                        'hire_date' => !empty($data['hire_date']) ? $data['hire_date'] : null,
                        'phone' => !empty($data['phone']) ? $data['phone'] : null,
                    ]);

                    // Assign supervisor as primary
                    $employee->supervisors()->attach($supervisorId, ['is_primary' => true]);

                    $balanceService->initializeBalancesForEmployee($employee);

                    ActivityLog::log('user.created', $newUser, [
                        'created_by' => auth()->id(),
                        'method' => 'batch_import',
                    ]);

                    return $newUser;
                });

                // Track for email sending and uniqueness
                $existingEmails[] = strtolower($data['email']);
                $existingEmpNumbers[] = $data['employee_number'];
                if (!empty($nric)) {
                    $existingNrics[] = $nric;
                }
                $createdUsers[] = ['user' => $newUser, 'password' => $plainPassword];
                $successCount++;
            } catch (\Exception $e) {
                $errors[] = ['row' => $rowNumber, 'message' => 'Failed to create: ' . $e->getMessage()];
            }
        }

        fclose($handle);

        // Send welcome emails outside the loop/transaction
        if ($sendEmails) {
            foreach ($createdUsers as $entry) {
                try {
                    $emailService->sendWelcomeEmail($entry['user'], $entry['password']);
                } catch (\Exception $e) {
                    // Don't fail the whole import for email issues
                    \Log::warning("Failed to send welcome email to {$entry['user']->email}: " . $e->getMessage());
                }
            }
        }

        return redirect()->route('users.batch-import')
            ->with('import_success_count', $successCount)
            ->with('import_errors', $errors)
            ->with('success', $successCount > 0 ? "{$successCount} user(s) imported successfully." : null);
    }

    public function toggleStatus(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot deactivate your own account.');
        }

        if (auth()->user()->role === 'admin') {
            if ($user->role === 'super_admin') {
                return back()->with('error', 'Admins cannot modify super admin accounts.');
            }
            if ($user->role === 'admin' && $user->id !== auth()->id()) {
                return back()->with('error', 'Admins cannot modify other admin accounts.');
            }
        }

        $user->update(['is_active' => !$user->is_active]);

        ActivityLog::log($user->is_active ? 'user.activated' : 'user.deactivated', $user);

        return back()->with('success', 'User status updated successfully.');
    }
}
