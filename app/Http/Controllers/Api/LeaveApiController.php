<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeLeaveBalance;
use App\Models\LeaveRequest;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveApiController extends Controller
{
    /**
     * Resolve a User + Employee from an email address.
     * Returns [user, null] on success, or [null, JsonResponse] on failure.
     */
    private function resolveEmployee(string $email): array
    {
        $user = User::where('email', $email)->with('employee')->first();

        if (!$user) {
            return [null, response()->json(['error' => 'User not found.'], 404)];
        }

        if (!$user->employee) {
            return [null, response()->json(['error' => 'User has no employee record.'], 404)];
        }

        return [$user, null];
    }

    /**
     * GET /api/v1/leaves/balance?email={email}&year={year}
     *
     * Returns leave balance entitlements for a user (entitled, used, pending, available).
     * Defaults to the current financial year; pass ?year= to override.
     */
    public function balance(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        [$user, $error] = $this->resolveEmployee($request->email);
        if ($error) return $error;

        $financialYear = $request->filled('year')
            ? $request->year
            : SystemSetting::getFinancialYear();

        $balances = EmployeeLeaveBalance::where('employee_id', $user->employee->id)
            ->where('financial_year', $financialYear)
            ->with('leaveType')
            ->get()
            ->map(fn($b) => [
                'leave_type'       => $b->leaveType->name,
                'leave_type_code'  => $b->leaveType->code,
                'entitled_days'    => $b->entitled_days,
                'carried_over'     => $b->carried_over,
                'adjustment'       => $b->adjustment,
                'total_entitled'   => $b->total_entitled,
                'used_days'        => $b->used_days,
                'pending_days'     => $b->pending_days,
                'available_balance'=> $b->available_balance,
            ]);

        return response()->json([
            'email'          => $request->email,
            'financial_year' => $financialYear,
            'balances'       => $balances,
        ]);
    }

    /**
     * GET /api/v1/leaves/summary?email={email}&year={year}
     *
     * Returns total leave count broken down by status and leave type.
     */
    public function summary(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        [$user, $error] = $this->resolveEmployee($request->email);
        if ($error) return $error;

        $query = LeaveRequest::where('employee_id', $user->employee->id)
            ->with('leaveType');

        if ($request->filled('year')) {
            $query->where('financial_year', $request->year);
        }

        $requests = $query->get();

        $byLeaveType = $requests->where('status', 'approved')
            ->groupBy('leave_type_id')
            ->map(fn($group) => [
                'leave_type'  => $group->first()->leaveType->name,
                'count'       => $group->count(),
                'total_days'  => (float) $group->sum('total_days'),
            ])
            ->values();

        return response()->json([
            'email'          => $request->email,
            'financial_year' => $request->filled('year') ? $request->year : 'all',
            'summary'        => [
                'total'             => $requests->count(),
                'by_status'         => [
                    'pending'   => $requests->where('status', 'pending')->count(),
                    'approved'  => $requests->where('status', 'approved')->count(),
                    'rejected'  => $requests->where('status', 'rejected')->count(),
                    'cancelled' => $requests->where('status', 'cancelled')->count(),
                ],
                'total_days_approved' => (float) $requests->where('status', 'approved')->sum('total_days'),
                'by_leave_type'     => $byLeaveType,
            ],
        ]);
    }

    /**
     * GET /api/v1/leaves/pending?email={email}
     *
     * Returns all pending (awaiting approval) leave requests for the user.
     */
    public function pending(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        [$user, $error] = $this->resolveEmployee($request->email);
        if ($error) return $error;

        $pendingRequests = LeaveRequest::where('employee_id', $user->employee->id)
            ->where('status', 'pending')
            ->with('leaveType')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($r) => [
                'id'           => $r->id,
                'leave_type'   => $r->leaveType->name,
                'start_date'   => $r->start_date->format('Y-m-d'),
                'end_date'     => $r->end_date->format('Y-m-d'),
                'total_days'   => $r->total_days,
                'reason'       => $r->reason,
                'submitted_at' => $r->created_at->toIso8601String(),
            ]);

        return response()->json([
            'email'            => $request->email,
            'pending_count'    => $pendingRequests->count(),
            'pending_requests' => $pendingRequests,
        ]);
    }

    /**
     * GET /api/v1/leaves/history?email={email}&year={year}
     *
     * Returns the leave history (approved / rejected / cancelled) for a user.
     */
    public function history(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        [$user, $error] = $this->resolveEmployee($request->email);
        if ($error) return $error;

        $query = LeaveRequest::where('employee_id', $user->employee->id)
            ->whereIn('status', ['approved', 'rejected', 'cancelled'])
            ->with(['leaveType', 'approver']);

        if ($request->filled('year')) {
            $query->where('financial_year', $request->year);
        }

        $history = $query->orderBy('start_date', 'desc')
            ->get()
            ->map(fn($r) => [
                'id'             => $r->id,
                'leave_type'     => $r->leaveType->name,
                'start_date'     => $r->start_date->format('Y-m-d'),
                'end_date'       => $r->end_date->format('Y-m-d'),
                'total_days'     => $r->total_days,
                'status'         => $r->status,
                'reason'         => $r->reason,
                'approved_by'    => $r->approver?->name,
                'approved_at'    => $r->approved_at?->format('Y-m-d'),
                'financial_year' => $r->financial_year,
            ]);

        return response()->json([
            'email'          => $request->email,
            'financial_year' => $request->filled('year') ? $request->year : 'all',
            'total'          => $history->count(),
            'history'        => $history,
        ]);
    }

    /**
     * GET /api/v1/manager/pending-approvals
     *
     * Returns all pending leave requests that the authenticated manager needs to approve.
     * Identity is taken from the Bearer token — no email param required.
     * - super_admin / admin  : all pending requests system-wide
     * - manager              : requests from direct subordinates + managed department employees
     */
    public function managerPendingApprovals(Request $request): JsonResponse
    {
        $manager = $request->user()->load('employee');

        if (!$manager->isManager()) {
            return response()->json([
                'error'          => 'Your account does not have manager privileges.',
                'role'           => $manager->role,
                'required_roles' => ['manager', 'admin', 'super_admin'],
            ], 403);
        }

        $pendingRequests = collect();

        if ($manager->isAdmin()) {
            // super_admin / admin see all pending requests
            $pendingRequests = LeaveRequest::where('status', 'pending')
                ->with(['employee.user', 'employee.department', 'leaveType'])
                ->orderBy('created_at', 'asc')
                ->get();
        } else {
            // Manager role: subordinates via employee_supervisors pivot
            if ($manager->employee) {
                $subordinateIds = $manager->employee->subordinates()->pluck('employees.id');

                $pendingRequests = LeaveRequest::where('status', 'pending')
                    ->whereIn('employee_id', $subordinateIds)
                    ->with(['employee.user', 'employee.department', 'leaveType'])
                    ->orderBy('created_at', 'asc')
                    ->get();

                // Also include employees in departments this user manages
                $managedDeptEmployeeIds = Employee::whereHas(
                    'department',
                    fn($q) => $q->where('manager_id', $manager->id)
                )->pluck('id');

                if ($managedDeptEmployeeIds->isNotEmpty()) {
                    $deptPending = LeaveRequest::where('status', 'pending')
                        ->whereIn('employee_id', $managedDeptEmployeeIds)
                        ->whereNotIn('employee_id', $subordinateIds)
                        ->with(['employee.user', 'employee.department', 'leaveType'])
                        ->orderBy('created_at', 'asc')
                        ->get();

                    $pendingRequests = $pendingRequests->merge($deptPending);
                }
            }
        }

        $mapped = $pendingRequests->map(fn($r) => [
            'id'             => $r->id,
            'employee_name'  => $r->employee->user->name,
            'employee_email' => $r->employee->user->email,
            'department'     => $r->employee->department?->name,
            'leave_type'     => $r->leaveType->name,
            'start_date'     => $r->start_date->format('Y-m-d'),
            'end_date'       => $r->end_date->format('Y-m-d'),
            'total_days'     => $r->total_days,
            'reason'         => $r->reason,
            'submitted_at'   => $r->created_at->toIso8601String(),
        ])->values();

        return response()->json([
            'manager_email'     => $manager->email,
            'manager_role'      => $manager->role,
            'pending_count'     => $mapped->count(),
            'pending_approvals' => $mapped,
        ]);
    }
}
