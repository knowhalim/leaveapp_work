<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\EmployeeType;
use App\Models\LeaveType;
use App\Models\LeaveTypeAllowance;
use App\Services\LeaveBalanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LeaveTypeController extends Controller
{
    public function index()
    {
        $leaveTypes = LeaveType::with('allowances.employeeType')
            ->orderBy('name')
            ->paginate(100);

        return Inertia::render('Admin/LeaveTypes/Index', [
            'leaveTypes' => $leaveTypes,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/LeaveTypes/Create', [
            'employeeTypes' => EmployeeType::active()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:10', 'unique:leave_types,code'],
            'color' => ['required', 'string', 'max:7'],
            'default_days' => ['required', 'integer', 'min:0'],
            'max_days' => ['nullable', 'integer', 'min:0'],
            'is_paid' => ['boolean'],
            'requires_attachment' => ['boolean'],
            'allow_attachment' => ['boolean'],
            'show_at_zero_balance' => ['boolean'],
            'hide_balance' => ['boolean'],
            'allows_half_day' => ['boolean'],
            'max_backdate_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'is_active' => ['boolean'],
            'allowances' => ['nullable', 'array'],
            'allowances.*.employee_type_id' => ['required', 'exists:employee_types,id'],
            'allowances.*.days_allowed' => ['required', 'numeric', 'min:0'],
        ]);

        $requiresAttachment = $validated['requires_attachment'] ?? false;
        $allowAttachment = ($validated['allow_attachment'] ?? false) || $requiresAttachment;

        DB::transaction(function () use ($validated, $requiresAttachment, $allowAttachment) {
            $leaveType = LeaveType::create([
                'name' => $validated['name'],
                'code' => strtoupper($validated['code']),
                'color' => $validated['color'],
                'default_days' => $validated['default_days'],
                'max_days' => $validated['max_days'],
                'is_paid' => $validated['is_paid'] ?? true,
                'requires_attachment' => $requiresAttachment,
                'allow_attachment' => $allowAttachment,
                'show_at_zero_balance' => $validated['show_at_zero_balance'] ?? false,
                'hide_balance' => $validated['hide_balance'] ?? false,
                'allows_half_day' => $validated['allows_half_day'] ?? true,
                'max_backdate_days' => $validated['max_backdate_days'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            if (!empty($validated['allowances'])) {
                foreach ($validated['allowances'] as $allowance) {
                    LeaveTypeAllowance::create([
                        'leave_type_id' => $leaveType->id,
                        'employee_type_id' => $allowance['employee_type_id'],
                        'days_allowed' => $allowance['days_allowed'],
                    ]);
                }
            }

            // Create balance records for all existing active employees
            app(LeaveBalanceService::class)->initializeBalancesForLeaveType($leaveType);

            ActivityLog::log('leave_type.created', $leaveType);
        });

        return redirect()->route('leave-types.index')
            ->with('success', 'Leave type created successfully.');
    }

    public function show(LeaveType $leaveType)
    {
        $leaveType->load('allowances.employeeType');

        return Inertia::render('Admin/LeaveTypes/Show', [
            'leaveType' => $leaveType,
        ]);
    }

    public function edit(LeaveType $leaveType)
    {
        $leaveType->load('allowances');

        return Inertia::render('Admin/LeaveTypes/Edit', [
            'leaveType' => $leaveType,
            'employeeTypes' => EmployeeType::active()->get(),
        ]);
    }

    public function update(Request $request, LeaveType $leaveType)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:10', 'unique:leave_types,code,' . $leaveType->id],
            'color' => ['required', 'string', 'max:7'],
            'default_days' => ['required', 'integer', 'min:0'],
            'max_days' => ['nullable', 'integer', 'min:0'],
            'is_paid' => ['boolean'],
            'requires_attachment' => ['boolean'],
            'allow_attachment' => ['boolean'],
            'show_at_zero_balance' => ['boolean'],
            'hide_balance' => ['boolean'],
            'allows_half_day' => ['boolean'],
            'max_backdate_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'is_active' => ['boolean'],
            'allowances' => ['nullable', 'array'],
            'allowances.*.employee_type_id' => ['required', 'exists:employee_types,id'],
            'allowances.*.days_allowed' => ['required', 'numeric', 'min:0'],
        ]);

        $requiresAttachment = $validated['requires_attachment'] ?? false;
        $allowAttachment = ($validated['allow_attachment'] ?? false) || $requiresAttachment;

        DB::transaction(function () use ($validated, $leaveType, $requiresAttachment, $allowAttachment) {
            $leaveType->update([
                'name' => $validated['name'],
                'code' => strtoupper($validated['code']),
                'color' => $validated['color'],
                'default_days' => $validated['default_days'],
                'max_days' => $validated['max_days'],
                'is_paid' => $validated['is_paid'] ?? true,
                'requires_attachment' => $requiresAttachment,
                'allow_attachment' => $allowAttachment,
                'show_at_zero_balance' => $validated['show_at_zero_balance'] ?? false,
                'hide_balance' => $validated['hide_balance'] ?? false,
                'allows_half_day' => $validated['allows_half_day'] ?? true,
                'max_backdate_days' => $validated['max_backdate_days'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $leaveType->allowances()->delete();

            if (!empty($validated['allowances'])) {
                foreach ($validated['allowances'] as $allowance) {
                    LeaveTypeAllowance::create([
                        'leave_type_id' => $leaveType->id,
                        'employee_type_id' => $allowance['employee_type_id'],
                        'days_allowed' => $allowance['days_allowed'],
                    ]);
                }
            }

            ActivityLog::log('leave_type.updated', $leaveType);
        });

        return redirect()->route('leave-types.index')
            ->with('success', 'Leave type updated successfully.');
    }

    public function destroy(LeaveType $leaveType)
    {
        if ($leaveType->leaveRequests()->count() > 0) {
            return back()->with('error', 'Cannot delete leave type with existing requests.');
        }

        ActivityLog::log('leave_type.deleted', $leaveType, [
            'leave_type_name' => $leaveType->name,
        ]);

        $leaveType->delete();

        return redirect()->route('leave-types.index')
            ->with('success', 'Leave type deleted successfully.');
    }

    public function toggleStatus(LeaveType $leaveType)
    {
        $leaveType->update(['is_active' => !$leaveType->is_active]);

        ActivityLog::log($leaveType->is_active ? 'leave_type.activated' : 'leave_type.deactivated', $leaveType);

        return back()->with('success', 'Leave type status updated.');
    }
}
