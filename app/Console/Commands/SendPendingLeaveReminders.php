<?php

namespace App\Console\Commands;

use App\Models\LeaveRequest;
use App\Models\User;
use App\Services\EmailService;
use Illuminate\Console\Command;

class SendPendingLeaveReminders extends Command
{
    protected $signature = 'app:send-pending-leave-reminders';
    protected $description = 'Remind supervisors of pending leave (day 3), escalate to admins (day 4)';

    public function handle(EmailService $emailService): void
    {
        // Day 3+: remind supervisors if not yet reminded
        $toRemind = LeaveRequest::with(['employee.user', 'employee.supervisors.user', 'employee.department.manager', 'leaveType'])
            ->pending()
            ->where('created_at', '<=', now()->subDays(3))
            ->whereNull('reminder_sent_at')
            ->get();

        foreach ($toRemind as $leave) {
            $emailService->sendPendingLeaveReminder($leave);
            $leave->update(['reminder_sent_at' => now()]);
            $this->info("Reminder sent for leave #{$leave->id} ({$leave->employee->user->name})");
        }

        // Day 4+: escalate to admins if reminder was sent but still pending
        $toEscalate = LeaveRequest::with(['employee.user', 'leaveType'])
            ->pending()
            ->where('created_at', '<=', now()->subDays(4))
            ->whereNotNull('reminder_sent_at')
            ->whereNull('admin_notified_at')
            ->get();

        foreach ($toEscalate as $leave) {
            $emailService->sendPendingLeaveAdminEscalation($leave);
            $leave->update(['admin_notified_at' => now()]);
            $this->info("Admin escalation sent for leave #{$leave->id} ({$leave->employee->user->name})");
        }

        $this->info('Done.');
    }
}
