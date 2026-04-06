<?php

namespace App\Console\Commands;

use App\Models\LeaveRequest;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendMonthlyAdminReport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-monthly-admin-report';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a monthly leave summary report to all admins and super admins.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $enabled = (bool) SystemSetting::get('cron_monthly_report_enabled', false);

        if (!$enabled) {
            $this->info('Monthly admin report is disabled. Skipping.');
            return Command::SUCCESS;
        }

        $mailEnabled = (bool) SystemSetting::get('mail_enabled', false);

        if (!$mailEnabled) {
            $this->info('Mail is disabled. Skipping monthly admin report.');
            return Command::SUCCESS;
        }

        // Previous calendar month
        $startOfLastMonth = Carbon::now()->subMonthNoOverflow()->startOfMonth();
        $endOfLastMonth   = Carbon::now()->subMonthNoOverflow()->endOfMonth();
        $monthLabel       = $startOfLastMonth->format('F Y'); // e.g. "February 2026"

        // Fetch leave requests for the previous month
        $requests = LeaveRequest::with(['leaveType', 'employee.user', 'employee.department'])
            ->whereBetween('start_date', [$startOfLastMonth, $endOfLastMonth])
            ->get();

        $total     = $requests->count();
        $approved  = $requests->where('status', 'approved')->count();
        $rejected  = $requests->where('status', 'rejected')->count();
        $pending   = $requests->where('status', 'pending')->count();
        $cancelled = $requests->where('status', 'cancelled')->count();

        // Breakdown by leave type
        $byLeaveType = $requests
            ->groupBy(fn ($r) => $r->leaveType->name ?? 'Unknown')
            ->map(fn ($group, $name) => [
                'name'  => $name,
                'count' => $group->count(),
                'days'  => round($group->sum('total_days'), 1),
            ])
            ->values()
            ->toArray();

        // Breakdown by department
        $byDepartment = $requests
            ->groupBy(fn ($r) => $r->employee->department->name ?? 'Unknown')
            ->map(fn ($group, $name) => [
                'name'  => $name,
                'count' => $group->count(),
            ])
            ->values()
            ->toArray();

        $stats = [
            'total'          => $total,
            'approved'       => $approved,
            'rejected'       => $rejected,
            'pending'        => $pending,
            'cancelled'      => $cancelled,
            'by_leave_type'  => $byLeaveType,
            'by_department'  => $byDepartment,
        ];

        $companyName = SystemSetting::getCompanyName();

        // Configure mail from database settings
        $this->configureMailFromSettings();

        // Find admins to notify
        $admins = User::whereIn('role', ['super_admin', 'admin'])
            ->where('is_active', true)
            ->get();

        if ($admins->isEmpty()) {
            $this->info('No active admins found to send report to.');
            return Command::SUCCESS;
        }

        $count = 0;

        foreach ($admins as $admin) {
            try {
                Mail::send(
                    'emails.admin-monthly-report',
                    [
                        'companyName' => $companyName,
                        'month'       => $monthLabel,
                        'stats'       => $stats,
                        'admin'       => $admin,
                    ],
                    function ($message) use ($admin, $monthLabel) {
                        $message->to($admin->email, $admin->name)
                            ->subject("Monthly Leave Summary Report — {$monthLabel}");
                    }
                );
                $count++;
            } catch (\Exception $e) {
                \Log::error('Failed to send monthly admin report to ' . $admin->email . ': ' . $e->getMessage());
            }
        }

        $this->info("Monthly admin report sent to {$count} admins.");

        return Command::SUCCESS;
    }

    /**
     * Configure mail settings from database (inlined from EmailService / SettingsController).
     */
    protected function configureMailFromSettings(): void
    {
        $mailer     = SystemSetting::get('mail_mailer', config('mail.default', 'smtp'));
        $encryption = SystemSetting::get('mail_encryption', 'tls');

        $scheme = null;
        if ($encryption === 'ssl') {
            $scheme = 'smtps';
        }

        config([
            'mail.default'                 => $mailer,
            'mail.mailers.smtp.host'       => SystemSetting::get('mail_host', config('mail.mailers.smtp.host', 'smtp.sendgrid.net')),
            'mail.mailers.smtp.port'       => SystemSetting::get('mail_port', config('mail.mailers.smtp.port', 587)),
            'mail.mailers.smtp.username'   => SystemSetting::get('mail_username', config('mail.mailers.smtp.username', '')),
            'mail.mailers.smtp.password'   => SystemSetting::get('mail_password', config('mail.mailers.smtp.password', '')),
            'mail.mailers.smtp.scheme'     => $scheme,
            'mail.from.address'            => SystemSetting::get('mail_from_address', config('mail.from.address', 'noreply@example.com')),
            'mail.from.name'               => SystemSetting::getCompanyName(),
        ]);

        Mail::forgetMailers();
    }
}
