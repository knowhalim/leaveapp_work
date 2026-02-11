<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeType;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class MassEmailController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/MassEmail', [
            'departments' => Department::active()->get(),
            'employeeTypes' => EmployeeType::active()->get(),
            'roles' => ['employee', 'manager', 'admin', 'super_admin'],
        ]);
    }

    public function preview(Request $request)
    {
        try {
            $validated = $request->validate([
                'recipient_type' => ['required', 'string', 'in:all,department,employee_type,role'],
                'department_id' => ['nullable', 'exists:departments,id'],
                'employee_type_id' => ['nullable', 'exists:employee_types,id'],
                'role' => ['nullable', 'string', 'in:employee,manager,admin,super_admin'],
            ]);

            $recipients = $this->getRecipients($validated);

            return response()->json([
                'count' => $recipients->count(),
                'recipients' => $recipients->take(50)->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ];
                }),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'count' => 0,
                'recipients' => [],
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Mass email preview failed: ' . $e->getMessage());
            return response()->json([
                'count' => 0,
                'recipients' => [],
                'message' => 'Failed to load recipients',
            ], 500);
        }
    }

    public function send(Request $request)
    {
        try {
            $validated = $request->validate([
                'subject' => ['required', 'string', 'max:255'],
                'message' => ['required', 'string', 'max:10000'],
                'recipient_type' => ['required', 'string', 'in:all,department,employee_type,role'],
                'department_id' => ['nullable', 'exists:departments,id'],
                'employee_type_id' => ['nullable', 'exists:employee_types,id'],
                'role' => ['nullable', 'string', 'in:employee,manager,admin,super_admin'],
            ]);

            // Check if email is enabled
            if (!SystemSetting::get('mail_enabled', false)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email notifications are disabled. Please enable them in Settings > Email.',
                ], 400);
            }

            // Configure mail settings
            $this->configureMailFromSettings();

            $recipients = $this->getRecipients($validated);

            if ($recipients->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No recipients found for the selected criteria.',
                ], 400);
            }

            $sentCount = 0;
            $failedCount = 0;

            foreach ($recipients as $user) {
                try {
                    Mail::raw($validated['message'], function ($mail) use ($user, $validated) {
                        $mail->to($user->email)
                            ->subject($validated['subject']);
                    });
                    $sentCount++;
                } catch (\Exception $e) {
                    \Log::error("Failed to send mass email to {$user->email}: " . $e->getMessage());
                    $failedCount++;
                }
            }

            // Log the activity
            ActivityLog::log('mass_email.sent', null, [
                'subject' => $validated['subject'],
                'recipient_type' => $validated['recipient_type'],
                'total_recipients' => $recipients->count(),
                'sent_count' => $sentCount,
                'failed_count' => $failedCount,
                'sent_by' => auth()->user()->name,
            ]);

            if ($failedCount > 0) {
                return response()->json([
                    'success' => true,
                    'message' => "Sent {$sentCount} email(s) successfully. {$failedCount} failed.",
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => "Successfully sent {$sentCount} email(s).",
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Mass email send failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send emails: ' . $e->getMessage(),
            ], 500);
        }
    }

    protected function getRecipients(array $filters)
    {
        $query = User::where('is_active', true);

        switch ($filters['recipient_type']) {
            case 'department':
                if (!empty($filters['department_id'])) {
                    $query->whereHas('employee', function ($q) use ($filters) {
                        $q->where('department_id', $filters['department_id']);
                    });
                }
                break;

            case 'employee_type':
                if (!empty($filters['employee_type_id'])) {
                    $query->whereHas('employee', function ($q) use ($filters) {
                        $q->where('employee_type_id', $filters['employee_type_id']);
                    });
                }
                break;

            case 'role':
                if (!empty($filters['role'])) {
                    $query->where('role', $filters['role']);
                }
                break;

            case 'all':
            default:
                // No additional filters, get all active users
                break;
        }

        return $query->orderBy('name')->get();
    }

    protected function configureMailFromSettings()
    {
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
}
