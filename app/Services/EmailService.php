<?php

namespace App\Services;

use App\Models\LeaveRequest;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class EmailService
{
    protected function isEmailEnabled(): bool
    {
        return (bool) SystemSetting::get('mail_enabled', false);
    }

    protected function configureMailFromSettings(): void
    {
        // Read from database with .env fallback
        $mailer = SystemSetting::get('mail_mailer', config('mail.default', 'smtp'));
        $encryption = SystemSetting::get('mail_encryption', config('mail.mailers.smtp.scheme', 'tls'));

        // Laravel 11 uses 'scheme' - convert encryption setting
        // For TLS (port 587), scheme should be null (STARTTLS is automatic)
        // For SSL (port 465), scheme should be 'smtps'
        $scheme = null;
        if ($encryption === 'ssl') {
            $scheme = 'smtps';
        }

        config([
            'mail.default' => $mailer,
            'mail.mailers.smtp.host' => SystemSetting::get('mail_host', config('mail.mailers.smtp.host', 'smtp.sendgrid.net')),
            'mail.mailers.smtp.port' => SystemSetting::get('mail_port', config('mail.mailers.smtp.port', 587)),
            'mail.mailers.smtp.username' => SystemSetting::get('mail_username', config('mail.mailers.smtp.username', '')),
            'mail.mailers.smtp.password' => SystemSetting::get('mail_password', config('mail.mailers.smtp.password', '')),
            'mail.mailers.smtp.scheme' => $scheme,
            'mail.from.address' => SystemSetting::get('mail_from_address', config('mail.from.address', 'noreply@example.com')),
            'mail.from.name' => SystemSetting::getCompanyName(),
        ]);

        // Purge cached mailer instances so new config takes effect
        Mail::forgetMailers();
    }

    public function sendLeaveRequestNotification(LeaveRequest $leaveRequest): void
    {
        $leaveRequest->load(['employee.user', 'employee.department', 'employee.supervisors.user', 'leaveType']);

        $employeeUser = $leaveRequest->employee->user;

        // If the employee is a manager or admin, notify admins/super_admins who can approve
        if ($employeeUser->isManager() || $employeeUser->isAdmin()) {
            $admins = User::where('is_active', true)
                ->whereIn('role', ['admin', 'super_admin'])
                ->where('id', '!=', $employeeUser->id) // Don't notify themselves
                ->get();

            foreach ($admins as $admin) {
                $this->sendEmail(
                    $admin->email,
                    'New Leave Request Pending Approval',
                    'emails.leave.request-pending',
                    [
                        'leaveRequest' => $leaveRequest,
                        'manager' => $admin,
                    ]
                );
            }
        } else {
            // For regular employees, notify their supervisors
            $supervisors = $leaveRequest->employee->supervisors;
            $notifiedUserIds = [];

            foreach ($supervisors as $supervisor) {
                $this->sendEmail(
                    $supervisor->user->email,
                    'New Leave Request Pending Approval',
                    'emails.leave.request-pending',
                    [
                        'leaveRequest' => $leaveRequest,
                        'supervisor' => $supervisor,
                    ]
                );
                $notifiedUserIds[] = $supervisor->user->id;
            }

            // Also notify department manager (if different from employee and not already notified as supervisor)
            $department = $leaveRequest->employee->department;
            if ($department && $department->manager && $department->manager->id !== $employeeUser->id && !in_array($department->manager->id, $notifiedUserIds)) {
                $this->sendEmail(
                    $department->manager->email,
                    'New Leave Request Pending Approval',
                    'emails.leave.request-pending',
                    [
                        'leaveRequest' => $leaveRequest,
                        'manager' => $department->manager,
                    ]
                );
            }
        }
    }

    public function sendLeaveApprovedNotification(LeaveRequest $leaveRequest): void
    {
        $leaveRequest->load(['employee.user', 'leaveType', 'approver']);

        $this->sendEmail(
            $leaveRequest->employee->user->email,
            'Your Leave Request Has Been Approved',
            'emails.leave.approved',
            [
                'leaveRequest' => $leaveRequest,
            ]
        );
    }

    public function sendLeaveRejectedNotification(LeaveRequest $leaveRequest): void
    {
        $leaveRequest->load(['employee.user', 'leaveType', 'approver']);

        $this->sendEmail(
            $leaveRequest->employee->user->email,
            'Your Leave Request Has Been Rejected',
            'emails.leave.rejected',
            [
                'leaveRequest' => $leaveRequest,
            ]
        );
    }

    public function sendLeaveCancelledNotification(LeaveRequest $leaveRequest): void
    {
        $leaveRequest->load(['employee.user', 'employee.department', 'employee.supervisors.user', 'leaveType']);

        $employeeUser = $leaveRequest->employee->user;

        // Notify the employee who applied
        $this->sendEmail(
            $employeeUser->email,
            'Your Leave Request Has Been Cancelled',
            'emails.leave.cancelled',
            [
                'leaveRequest' => $leaveRequest,
                'recipientName' => $employeeUser->name,
                'isEmployee' => true,
            ]
        );

        // Notify all assigned supervisors
        $notifiedUserIds = [$employeeUser->id];
        foreach ($leaveRequest->employee->supervisors as $supervisor) {
            if (!$supervisor->user || in_array($supervisor->user->id, $notifiedUserIds)) {
                continue;
            }
            $this->sendEmail(
                $supervisor->user->email,
                'Leave Request Cancelled',
                'emails.leave.cancelled',
                [
                    'leaveRequest' => $leaveRequest,
                    'recipientName' => $supervisor->user->name,
                    'isEmployee' => false,
                ]
            );
            $notifiedUserIds[] = $supervisor->user->id;
        }

        // Notify department manager if not already notified
        $department = $leaveRequest->employee->department;
        if ($department && $department->manager && !in_array($department->manager->id, $notifiedUserIds)) {
            $this->sendEmail(
                $department->manager->email,
                'Leave Request Cancelled',
                'emails.leave.cancelled',
                [
                    'leaveRequest' => $leaveRequest,
                    'recipientName' => $department->manager->name,
                    'isEmployee' => false,
                ]
            );
        }
    }

    public function sendWelcomeEmail(User $user, string $temporaryPassword = null): void
    {
        $roleDefaults = [
            'employee' => 'Employee',
            'manager' => 'Manager',
            'admin' => 'Admin',
            'super_admin' => 'Super Admin',
        ];
        $roleLabel = \App\Models\SystemSetting::get(
            'role_label_' . $user->role,
            $roleDefaults[$user->role] ?? ucwords(str_replace('_', ' ', $user->role))
        );

        $passwordLoginEnabled = (bool) \App\Models\SystemSetting::get('password_login_enabled', true);

        $onboardingHtml = $this->renderOnboardingHtml($user, $roleLabel);

        $this->sendEmail(
            $user->email,
            'Welcome to ' . \App\Models\SystemSetting::getCompanyName(),
            'emails.welcome',
            [
                'user' => $user,
                'temporaryPassword' => $passwordLoginEnabled ? $temporaryPassword : null,
                'roleLabel' => $roleLabel,
                'passwordLoginEnabled' => $passwordLoginEnabled,
                'loginUrl' => url('/login'),
                'onboardingHtml' => $onboardingHtml,
            ]
        );
    }

    public function sendRoleChangedEmail(User $user, string $oldRole, User $changedBy): void
    {
        $roleDefaults = [
            'employee' => 'Employee',
            'manager' => 'Manager',
            'admin' => 'Admin',
            'super_admin' => 'Super Admin',
        ];
        $label = fn (string $role) => \App\Models\SystemSetting::get(
            'role_label_' . $role,
            $roleDefaults[$role] ?? ucwords(str_replace('_', ' ', $role))
        );
        $newRoleLabel = $label($user->role);
        $oldRoleLabel = $label($oldRole);

        $onboardingHtml = $this->renderOnboardingHtml($user, $newRoleLabel);

        $this->sendEmail(
            $user->email,
            'Your role has been updated - ' . \App\Models\SystemSetting::getCompanyName(),
            'emails.role-changed',
            [
                'user' => $user,
                'oldRoleLabel' => $oldRoleLabel,
                'newRoleLabel' => $newRoleLabel,
                'changedByName' => $changedBy->name,
                'loginUrl' => url('/login'),
                'onboardingHtml' => $onboardingHtml,
            ]
        );
    }

    protected function renderOnboardingHtml(User $user, string $roleLabel): string
    {
        $role = $user->role;
        $customEnabled = (bool) \App\Models\SystemSetting::get("onboarding_custom_{$role}_enabled", false);

        if ($customEnabled) {
            $body = (string) \App\Models\SystemSetting::get("onboarding_custom_{$role}_body", '');
            if ($body !== '') {
                return strtr($body, [
                    '{{role}}'    => e($roleLabel),
                    '{{company}}' => e(\App\Models\SystemSetting::getCompanyName()),
                    '{{name}}'    => e($user->name),
                    '{{email}}'   => e($user->email),
                ]);
            }
        }

        $partial = 'emails.onboarding.' . str_replace('_', '-', $role);
        if (!view()->exists($partial)) {
            return '';
        }

        return view($partial, ['roleLabel' => $roleLabel])->render();
    }

    public function sendMagicLinkEmail(User $user, string $token): void
    {
        $this->sendEmail(
            $user->email,
            'Your Login Link - ' . \App\Models\SystemSetting::getCompanyName(),
            'emails.magic-link',
            [
                'user' => $user,
                'loginUrl' => url('/magic-link/' . $token),
            ]
        );
    }

    public function sendPendingLeaveReminder(LeaveRequest $leaveRequest): void
    {
        $leaveRequest->load(['employee.user', 'employee.supervisors.user', 'employee.department', 'leaveType']);
        $employeeUser = $leaveRequest->employee->user;
        $daysPending = (int) floor($leaveRequest->created_at->diffInDays(now()));

        $notifiedIds = [];

        foreach ($leaveRequest->employee->supervisors as $supervisor) {
            if (!$supervisor->user) continue;
            $this->sendEmail(
                $supervisor->user->email,
                'Reminder: Leave Request Awaiting Your Approval',
                'emails.leave.reminder-pending',
                ['leaveRequest' => $leaveRequest, 'recipient' => $supervisor->user, 'daysPending' => $daysPending]
            );
            $notifiedIds[] = $supervisor->user->id;
        }

        $dept = $leaveRequest->employee->department;
        if ($dept && $dept->manager && !in_array($dept->manager->id, $notifiedIds)) {
            $this->sendEmail(
                $dept->manager->email,
                'Reminder: Leave Request Awaiting Your Approval',
                'emails.leave.reminder-pending',
                ['leaveRequest' => $leaveRequest, 'recipient' => $dept->manager, 'daysPending' => $daysPending]
            );
        }
    }

    public function sendPendingLeaveAdminEscalation(LeaveRequest $leaveRequest): void
    {
        $leaveRequest->load(['employee.user', 'leaveType']);
        $daysPending = (int) floor($leaveRequest->created_at->diffInDays(now()));

        $admins = User::where('is_active', true)
            ->whereIn('role', ['admin', 'super_admin'])
            ->get();

        foreach ($admins as $admin) {
            $this->sendEmail(
                $admin->email,
                'Action Required: Leave Request Has Not Been Approved',
                'emails.leave.admin-escalation',
                ['leaveRequest' => $leaveRequest, 'admin' => $admin, 'daysPending' => $daysPending]
            );
        }
    }

    public function sendBulkDeleteConfirmationEmail(User $admin, $usersToDelete, string $token): void
    {
        $this->sendEmail(
            $admin->email,
            'Confirm Bulk User Deletion',
            'emails.bulk-delete-confirm',
            [
                'admin' => $admin,
                'usersToDelete' => $usersToDelete,
                'confirmUrl' => url('/users/bulk-delete/confirm/' . $token),
                'count' => $usersToDelete->count(),
            ]
        );
    }

    public function sendPasswordResetEmail(User $user, string $token): void
    {
        $this->sendEmail(
            $user->email,
            'Password Reset Request',
            'emails.password-reset',
            [
                'user' => $user,
                'token' => $token,
                'resetUrl' => url('/reset-password?token=' . $token . '&email=' . $user->email),
            ]
        );
    }

    public function sendReportEmail(User $user, string $csvContent, string $filename, string $reportTypeLabel, string $year): void
    {
        if (!$this->isEmailEnabled()) {
            \Log::info('Email notifications disabled, skipping report email', ['to' => $user->email]);
            return;
        }

        try {
            $this->configureMailFromSettings();

            $html = view('emails.report', [
                'user'             => $user,
                'reportTypeLabel'  => $reportTypeLabel,
                'year'             => $year,
                'generatedAt'      => now()->format('Y-m-d H:i:s'),
            ])->render();

            \Illuminate\Support\Facades\Mail::html($html, function ($message) use ($user, $csvContent, $filename, $reportTypeLabel, $year) {
                $message->to($user->email, $user->name)
                    ->subject("{$reportTypeLabel} - Financial Year {$year}")
                    ->attachData($csvContent, $filename, ['mime' => 'text/csv']);
            });
        } catch (\Exception $e) {
            \Log::error("Failed to send report email: {$e->getMessage()}", ['to' => $user->email]);
        }
    }

    protected function sendEmail(string $to, string $subject, string $view, array $data): void
    {
        if (!$this->isEmailEnabled()) {
            \Log::info("Email notifications disabled, skipping email", [
                'to' => $to,
                'subject' => $subject,
            ]);
            return;
        }

        try {
            $this->configureMailFromSettings();

            Mail::send($view, $data, function ($message) use ($to, $subject) {
                $message->to($to)
                    ->subject($subject);
            });
        } catch (\Exception $e) {
            \Log::error("Failed to send email: {$e->getMessage()}", [
                'to' => $to,
                'subject' => $subject,
            ]);
        }
    }
}
