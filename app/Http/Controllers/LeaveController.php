<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Employee;
use App\Models\EmployeeLeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\SystemSetting;
use App\Services\EmailService;
use App\Services\LeaveCalculationService;
use App\Services\WebhookService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class LeaveController extends Controller
{
    public function __construct(
        protected LeaveCalculationService $calculationService,
        protected WebhookService $webhookService,
        protected EmailService $emailService
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $query = LeaveRequest::with(['employee.user', 'leaveType', 'approver']);

        if (!$user->isAdmin()) {
            if ($user->isManager()) {
                $managedDepartmentIds = $user->managedDepartments()->pluck('id');
                $subordinateIds = $user->employee
                    ? $user->employee->subordinates()->pluck('employees.id')
                    : collect();
                $teamEmployeeIds = Employee::where(function ($q) use ($managedDepartmentIds, $subordinateIds) {
                    $q->whereIn('department_id', $managedDepartmentIds)
                        ->orWhereIn('id', $subordinateIds);
                })->pluck('id');
                $query->whereIn('employee_id', $teamEmployeeIds);
            } else {
                $query->where('employee_id', $user->employee?->id);
            }
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('leave_type') && $request->leave_type !== 'all') {
            $query->where('leave_type_id', $request->leave_type);
        }

        if ($request->has('date_from')) {
            $query->where('start_date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('end_date', '<=', $request->date_to);
        }

        $leaveRequests = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Leave/Index', [
            'leaveRequests' => $leaveRequests,
            'leaveTypes' => LeaveType::active()->get(),
            'filters' => $request->only(['status', 'leave_type', 'date_from', 'date_to']),
        ]);
    }

    public function create()
    {
        $employee = auth()->user()->employee;
        $financialYear = SystemSetting::getFinancialYear();

        $leaveBalances = $employee->leaveBalances()
            ->where('financial_year', $financialYear)
            ->with('leaveType')
            ->get();

        return Inertia::render('Leave/Create', [
            'leaveTypes' => LeaveType::active()->get(),
            'leaveBalances' => $leaveBalances,
            'financialYear' => $financialYear,
        ]);
    }

    public function store(Request $request)
    {
        $leaveType = LeaveType::findOrFail($request->leave_type_id);
        $minDate = now()->subDays($leaveType->max_backdate_days ?? 0)->format('Y-m-d');

        $validated = $request->validate([
            'leave_type_id' => ['required', 'exists:leave_types,id'],
            'start_date' => ['required', 'date', 'after_or_equal:' . $minDate],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'start_half' => ['required', 'in:full,first_half,second_half'],
            'end_half' => ['required', 'in:full,first_half,second_half'],
            'reason' => ['nullable', 'string', 'max:1000'],
            'attachment' => ['nullable', 'file', 'max:5120'],
        ]);

        $employee = auth()->user()->employee;
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
            return back()->withErrors(['leave_type_id' => 'Insufficient leave balance.']);
        }

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('leave-attachments', 'public');
        }

        $leaveRequest = DB::transaction(function () use ($validated, $employee, $totalDays, $financialYear, $attachmentPath, $balance) {
            $leaveRequest = LeaveRequest::create([
                'employee_id' => $employee->id,
                'leave_type_id' => $validated['leave_type_id'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'start_half' => $validated['start_half'],
                'end_half' => $validated['end_half'],
                'total_days' => $totalDays,
                'reason' => $validated['reason'],
                'attachment_path' => $attachmentPath,
                'financial_year' => $financialYear,
                'status' => 'pending',
            ]);

            if ($balance) {
                $balance->increment('pending_days', $totalDays);
            }

            ActivityLog::log('leave.requested', $leaveRequest);

            $this->webhookService->trigger('leave.requested', $leaveRequest);

            return $leaveRequest;
        });

        // Send email notification to supervisors/managers
        $this->emailService->sendLeaveRequestNotification($leaveRequest);

        return redirect()->route('leaves.index')
            ->with('success', 'Leave request submitted successfully.');
    }

    public function show(LeaveRequest $leave)
    {
        $leave->load(['employee.user', 'leaveType', 'approver', 'comments.user']);

        return Inertia::render('Leave/Show', [
            'leaveRequest' => $leave,
        ]);
    }

    public function approve(Request $request, LeaveRequest $leave)
    {
        if (!$leave->isPending()) {
            return back()->with('error', 'This leave request has already been processed.');
        }

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($leave, $validated) {
            $leave->update([
                'status' => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
                'approval_notes' => $validated['notes'] ?? null,
            ]);

            $balance = EmployeeLeaveBalance::where('employee_id', $leave->employee_id)
                ->where('leave_type_id', $leave->leave_type_id)
                ->where('financial_year', $leave->financial_year)
                ->first();

            if ($balance) {
                $balance->decrement('pending_days', $leave->total_days);
                $balance->increment('used_days', $leave->total_days);
            }

            ActivityLog::log('leave.approved', $leave);

            $this->webhookService->trigger('leave.approved', $leave);
        });

        // Send email notification to employee
        $this->emailService->sendLeaveApprovedNotification($leave);

        return back()->with('success', 'Leave request approved successfully.');
    }

    public function reject(Request $request, LeaveRequest $leave)
    {
        if (!$leave->isPending()) {
            return back()->with('error', 'This leave request has already been processed.');
        }

        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($leave, $validated) {
            $leave->update([
                'status' => 'rejected',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
                'approval_notes' => $validated['notes'],
            ]);

            $balance = EmployeeLeaveBalance::where('employee_id', $leave->employee_id)
                ->where('leave_type_id', $leave->leave_type_id)
                ->where('financial_year', $leave->financial_year)
                ->first();

            if ($balance) {
                $balance->decrement('pending_days', $leave->total_days);
            }

            ActivityLog::log('leave.rejected', $leave);

            $this->webhookService->trigger('leave.rejected', $leave);
        });

        // Send email notification to employee
        $this->emailService->sendLeaveRejectedNotification($leave);

        return back()->with('success', 'Leave request rejected.');
    }

    public function cancel(LeaveRequest $leave)
    {
        if (!$leave->canBeCancelled()) {
            return back()->with('error', 'This leave request cannot be cancelled.');
        }

        $user = auth()->user();
        if ($leave->employee->user_id !== $user->id && !$user->isAdmin()) {
            return back()->with('error', 'You are not authorized to cancel this request.');
        }

        DB::transaction(function () use ($leave) {
            $previousStatus = $leave->status;

            $leave->update(['status' => 'cancelled']);

            $balance = EmployeeLeaveBalance::where('employee_id', $leave->employee_id)
                ->where('leave_type_id', $leave->leave_type_id)
                ->where('financial_year', $leave->financial_year)
                ->first();

            if ($balance) {
                if ($previousStatus === 'pending') {
                    $balance->decrement('pending_days', $leave->total_days);
                } elseif ($previousStatus === 'approved') {
                    $balance->decrement('used_days', $leave->total_days);
                }
            }

            ActivityLog::log('leave.cancelled', $leave);

            $this->webhookService->trigger('leave.cancelled', $leave);
        });

        // Send email notification to manager
        $this->emailService->sendLeaveCancelledNotification($leave);

        return back()->with('success', 'Leave request cancelled.');
    }

    public function addComment(Request $request, LeaveRequest $leave)
    {
        $validated = $request->validate([
            'comment' => ['required', 'string', 'max:1000'],
            'is_internal' => ['boolean'],
        ]);

        $leave->comments()->create([
            'user_id' => auth()->id(),
            'comment' => $validated['comment'],
            'is_internal' => $validated['is_internal'] ?? false,
        ]);

        return back()->with('success', 'Comment added.');
    }

    public function pending(Request $request)
    {
        $user = $request->user();
        $query = LeaveRequest::with(['employee.user', 'leaveType'])->pending();

        if ($user->isManager() && !$user->isAdmin()) {
            $managedDepartmentIds = $user->managedDepartments()->pluck('id');
            $subordinateIds = $user->employee
                ? $user->employee->subordinates()->pluck('employees.id')
                : collect();
            $teamEmployeeIds = Employee::where(function ($q) use ($managedDepartmentIds, $subordinateIds) {
                $q->whereIn('department_id', $managedDepartmentIds)
                    ->orWhereIn('id', $subordinateIds);
            })->pluck('id');
            $query->whereIn('employee_id', $teamEmployeeIds);
        }

        $pendingRequests = $query->latest()->paginate(15);

        return Inertia::render('Leave/Pending', [
            'pendingRequests' => $pendingRequests,
        ]);
    }

    public function viewAttachment(LeaveRequest $leave)
    {
        $user = auth()->user();

        // Check authorization: owner, manager, or admin can view
        $canView = $leave->employee->user_id === $user->id
            || $user->isManager()
            || $user->isAdmin();

        if (!$canView) {
            abort(403, 'You are not authorized to view this attachment.');
        }

        if (!$leave->attachment_path) {
            abort(404, 'No attachment found for this leave request.');
        }

        if (!Storage::disk('public')->exists($leave->attachment_path)) {
            abort(404, 'Attachment file not found.');
        }

        return Storage::disk('public')->response($leave->attachment_path);
    }
}
