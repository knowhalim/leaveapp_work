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
            'mail.from.name' => SystemSetting::get('mail_from_name', config('mail.from.name', config('app.name'))),
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
            }

            // Also notify department manager (if different from employee)
            $department = $leaveRequest->employee->department;
            if ($department && $department->manager && $department->manager->id !== $employeeUser->id) {
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
        $leaveRequest->load(['employee.user', 'leaveType']);

        $department = $leaveRequest->employee->department;
        if ($department && $department->manager) {
            $this->sendEmail(
                $department->manager->email,
                'Leave Request Cancelled',
                'emails.leave.cancelled',
                [
                    'leaveRequest' => $leaveRequest,
                ]
            );
        }
    }

    public function sendWelcomeEmail(User $user, string $temporaryPassword = null): void
    {
        $this->sendEmail(
            $user->email,
            'Welcome to HR Leave System',
            'emails.welcome',
            [
                'user' => $user,
                'temporaryPassword' => $temporaryPassword,
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
