<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\EmployeeType;
use App\Models\PublicHoliday;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = [
            'company_name' => SystemSetting::get('company_name', 'HR Leave System'),
            'financial_year' => SystemSetting::get('financial_year', date('Y')),
            'weekends' => SystemSetting::get('weekends', ['saturday', 'sunday']),
            'max_carry_forward' => SystemSetting::get('max_carry_forward', 5),
            'leave_year_start_month' => SystemSetting::get('leave_year_start_month', 1),
            'role_label_employee' => SystemSetting::get('role_label_employee', 'Employee'),
            'role_label_manager' => SystemSetting::get('role_label_manager', 'Manager'),
            'role_label_admin' => SystemSetting::get('role_label_admin', 'Admin'),
            'role_label_super_admin' => SystemSetting::get('role_label_super_admin', 'Super Admin'),
            'password_login_enabled' => (bool) SystemSetting::get('password_login_enabled', true),
        ];

        $apiTokens = [];
        if (auth()->user()->isSuperAdmin()) {
            $apiTokens = auth()->user()->tokens()
                ->select(['id', 'name', 'last_used_at', 'created_at'])
                ->latest()
                ->get();
        }

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
            'apiTokens' => $apiTokens,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'financial_year' => ['required', 'string', 'max:9'],
            'weekends' => ['required', 'array'],
            'weekends.*' => ['string', 'in:sunday,monday,tuesday,wednesday,thursday,friday,saturday'],
            'max_carry_forward' => ['required', 'integer', 'min:0'],
            'leave_year_start_month' => ['required', 'integer', 'min:1', 'max:12'],
            'role_label_employee' => ['required', 'string', 'max:50'],
            'role_label_manager' => ['required', 'string', 'max:50'],
            'role_label_admin' => ['required', 'string', 'max:50'],
            'role_label_super_admin' => ['required', 'string', 'max:50'],
            'password_login_enabled' => ['sometimes', 'boolean'],
        ]);

        foreach ($validated as $key => $value) {
            if ($key === 'password_login_enabled') {
                $type = 'boolean';
            } elseif (is_array($value)) {
                $type = 'array';
            } elseif (is_int($value)) {
                $type = 'integer';
            } else {
                $type = 'string';
            }
            SystemSetting::set($key, $value, $type, 'general');
        }

        ActivityLog::log('settings.updated', null, $validated);

        return back()->with('success', 'Settings updated successfully.');
    }

    public function holidays()
    {
        $holidays = PublicHoliday::orderBy('date')->paginate(20);

        return Inertia::render('Admin/Settings/Holidays', [
            'holidays' => $holidays,
        ]);
    }

    public function storeHoliday(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'is_recurring' => ['boolean'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $holiday = PublicHoliday::create($validated);

        ActivityLog::log('holiday.created', $holiday);

        return back()->with('success', 'Holiday added successfully.');
    }

    public function updateHoliday(Request $request, PublicHoliday $holiday)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'is_recurring' => ['boolean'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $holiday->update($validated);

        ActivityLog::log('holiday.updated', $holiday);

        return back()->with('success', 'Holiday updated successfully.');
    }

    public function destroyHoliday(PublicHoliday $holiday)
    {
        ActivityLog::log('holiday.deleted', $holiday, [
            'holiday_name' => $holiday->name,
        ]);

        $holiday->delete();

        return back()->with('success', 'Holiday deleted successfully.');
    }

    public function employeeTypes()
    {
        $employeeTypes = EmployeeType::withCount('employees')->paginate(15);

        return Inertia::render('Admin/Settings/EmployeeTypes', [
            'employeeTypes' => $employeeTypes,
        ]);
    }

    public function storeEmployeeType(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:employee_types,name'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
        ]);

        $employeeType = EmployeeType::create($validated);

        ActivityLog::log('employee_type.created', $employeeType);

        return back()->with('success', 'Employee type created successfully.');
    }

    public function updateEmployeeType(Request $request, EmployeeType $employeeType)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:employee_types,name,' . $employeeType->id],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
        ]);

        $employeeType->update($validated);

        ActivityLog::log('employee_type.updated', $employeeType);

        return back()->with('success', 'Employee type updated successfully.');
    }

    public function destroyEmployeeType(EmployeeType $employeeType)
    {
        if ($employeeType->employees()->count() > 0) {
            return back()->with('error', 'Cannot delete employee type with assigned employees.');
        }

        ActivityLog::log('employee_type.deleted', $employeeType, [
            'name' => $employeeType->name,
        ]);

        $employeeType->delete();

        return back()->with('success', 'Employee type deleted successfully.');
    }

    public function emailTemplates()
    {
        $user = auth()->user();
        $roles = $user->isSuperAdmin()
            ? ['employee', 'manager', 'admin', 'super_admin']
            : ['employee', 'manager'];

        $roleLabels = [
            'employee'    => SystemSetting::get('role_label_employee', 'Employee'),
            'manager'     => SystemSetting::get('role_label_manager', 'Manager'),
            'admin'       => SystemSetting::get('role_label_admin', 'Admin'),
            'super_admin' => SystemSetting::get('role_label_super_admin', 'Super Admin'),
        ];

        $templates = [];
        foreach ($roles as $role) {
            $default = $this->defaultOnboardingHtml($role);
            $templates[$role] = [
                'label'   => $roleLabels[$role],
                'enabled' => (bool) SystemSetting::get("onboarding_custom_{$role}_enabled", false),
                'body'    => SystemSetting::get("onboarding_custom_{$role}_body", $default),
                'default' => $default,
            ];
        }

        return Inertia::render('Admin/Settings/EmailTemplates', [
            'roles'     => $roles,
            'templates' => $templates,
        ]);
    }

    public function updateEmailTemplates(Request $request)
    {
        $user = auth()->user();
        $allowedRoles = $user->isSuperAdmin()
            ? ['employee', 'manager', 'admin', 'super_admin']
            : ['employee', 'manager'];

        $rules = [];
        foreach ($allowedRoles as $role) {
            $rules["templates.{$role}.enabled"] = ['boolean'];
            $rules["templates.{$role}.body"]    = ['nullable', 'string', 'max:20000'];
        }

        $validated = $request->validate($rules);

        foreach ($allowedRoles as $role) {
            $enabled = (bool) ($validated['templates'][$role]['enabled'] ?? false);
            $body    = (string) ($validated['templates'][$role]['body'] ?? '');
            SystemSetting::set("onboarding_custom_{$role}_enabled", $enabled, 'boolean', 'email_template');
            SystemSetting::set("onboarding_custom_{$role}_body", $body, 'string', 'email_template');
        }

        ActivityLog::log('settings.email_templates_updated', null, [
            'roles' => $allowedRoles,
        ]);

        return back()->with('success', 'Email templates updated successfully.');
    }

    protected function defaultOnboardingHtml(string $role): string
    {
        switch ($role) {
            case 'manager':
                return <<<'HTML'
<p style="margin: 0 0 15px 0;">As a <strong>{{role}}</strong>, you have additional responsibilities in {{company}}:</p>

<ol style="margin: 0; padding-left: 20px;">
    <li style="margin-bottom: 10px;">
        <strong>Approve/Reject Leave Requests</strong><br>
        <span style="color: #6b7280;">Review and process leave requests from your team members. You'll receive email notifications when new requests are submitted.</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>View Team Calendar</strong><br>
        <span style="color: #6b7280;">See who in your team is on leave at any given time to help with planning and coverage.</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>Monitor Team Leave Balances</strong><br>
        <span style="color: #6b7280;">Keep track of your team's remaining leave days to ensure fair distribution and prevent year-end rush.</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>Submit Your Own Leave</strong><br>
        <span style="color: #6b7280;">As a {{role}}, your leave requests will be routed to administrators for approval.</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>Generate Team Reports</strong><br>
        <span style="color: #6b7280;">Access reports on team attendance and leave patterns to support workforce planning.</span>
    </li>
</ol>

<div style="background-color: #eff6ff; border-radius: 6px; padding: 15px; margin-top: 15px;">
    <p style="margin: 0; font-weight: bold; color: #1d4ed8;">{{role}} Tips</p>
    <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #1e40af;">
        <li>Review pending requests promptly to help your team plan their time off.</li>
        <li>Check the team calendar before approving to ensure adequate coverage.</li>
        <li>Add notes when rejecting requests to provide clear feedback.</li>
    </ul>
</div>
HTML;

            case 'admin':
                return <<<'HTML'
<p style="margin: 0 0 15px 0;">As an <strong>{{role}}</strong>, you have system management capabilities:</p>

<ol style="margin: 0; padding-left: 20px;">
    <li style="margin-bottom: 10px;">
        <strong>Manage Users</strong><br>
        <span style="color: #6b7280;">Create, edit, and deactivate user accounts. Assign roles and departments to employees.</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>Manage Departments</strong><br>
        <span style="color: #6b7280;">Create and organize departments, assign department managers, and manage team structures.</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>Configure Leave Types</strong><br>
        <span style="color: #6b7280;">Set up different leave categories with their allowances, rules, and requirements.</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>Approve Manager Leave Requests</strong><br>
        <span style="color: #6b7280;">Process leave requests from managers and other administrators.</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>Adjust Leave Balances</strong><br>
        <span style="color: #6b7280;">Make manual adjustments to employee leave balances when needed (e.g., special circumstances, corrections).</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>Generate Reports</strong><br>
        <span style="color: #6b7280;">Access organization-wide leave reports and analytics for HR planning.</span>
    </li>
</ol>

<div style="background-color: #fef3c7; border-radius: 6px; padding: 15px; margin-top: 15px;">
    <p style="margin: 0; font-weight: bold; color: #92400e;">{{role}} Responsibilities</p>
    <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #92400e;">
        <li>Ensure employee records are accurate and up to date.</li>
        <li>Review and update leave policies at the start of each financial year.</li>
        <li>Monitor system activity logs for any unusual patterns.</li>
    </ul>
</div>
HTML;

            case 'super_admin':
                return <<<'HTML'
<p style="margin: 0 0 15px 0;">As a <strong>{{role}}</strong>, you have full system control:</p>

<ol style="margin: 0; padding-left: 20px;">
    <li style="margin-bottom: 10px;">
        <strong>Full User Management</strong><br>
        <span style="color: #6b7280;">Create and manage all user accounts including other administrators. Assign any role to any user.</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>System Configuration</strong><br>
        <span style="color: #6b7280;">Configure system-wide settings including financial year, carry-forward limits, and email notifications.</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>Email Settings</strong><br>
        <span style="color: #6b7280;">Configure SMTP settings and manage email notifications across the system.</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>Employee Types Management</strong><br>
        <span style="color: #6b7280;">Define employee categories (full-time, part-time, contract) with different leave entitlements.</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>Holiday Calendar</strong><br>
        <span style="color: #6b7280;">Manage public holidays that affect leave calculations across the organization.</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>Activity Logs</strong><br>
        <span style="color: #6b7280;">Access complete audit trails of all system activities for compliance and security.</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>Year-End Processing</strong><br>
        <span style="color: #6b7280;">Initialize leave balances for new financial years and process carry-forward calculations.</span>
    </li>
</ol>

<div style="background-color: #fee2e2; border-radius: 6px; padding: 15px; margin-top: 15px;">
    <p style="margin: 0; font-weight: bold; color: #991b1b;">{{role}} Security Notice</p>
    <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #991b1b;">
        <li>Your account has the highest privilege level. Keep your credentials secure.</li>
        <li>All your actions are logged for audit purposes.</li>
        <li>Review system settings periodically to ensure proper configuration.</li>
        <li>Limit the number of {{role}} accounts to maintain security.</li>
    </ul>
</div>
HTML;

            case 'employee':
            default:
                return <<<'HTML'
<p style="margin: 0 0 15px 0;">As a <strong>{{role}}</strong>, here's what you can do in {{company}}:</p>

<ol style="margin: 0; padding-left: 20px;">
    <li style="margin-bottom: 10px;">
        <strong>View Your Dashboard</strong><br>
        <span style="color: #6b7280;">See your leave balances, upcoming leaves, and recent activity at a glance.</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>Submit Leave Requests</strong><br>
        <span style="color: #6b7280;">Apply for annual leave, sick leave, or other leave types. Select your dates, add a reason, and submit for approval.</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>Track Your Leave Balance</strong><br>
        <span style="color: #6b7280;">Monitor your remaining leave days for each leave type throughout the year.</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>View Leave History</strong><br>
        <span style="color: #6b7280;">Access your complete leave history including approved, rejected, and pending requests.</span>
    </li>
    <li style="margin-bottom: 10px;">
        <strong>Update Your Profile</strong><br>
        <span style="color: #6b7280;">Keep your personal information and contact details up to date.</span>
    </li>
</ol>

<div style="background-color: #eff6ff; border-radius: 6px; padding: 15px; margin-top: 15px;">
    <p style="margin: 0; font-weight: bold; color: #1d4ed8;">Quick Tip</p>
    <p style="margin: 10px 0 0 0; color: #1e40af;">Submit leave requests in advance whenever possible to ensure smooth approval and team planning.</p>
</div>
HTML;
        }
    }

    public function email()
    {
        // Read from database first, fall back to .env configuration
        $settings = [
            'mail_enabled' => SystemSetting::get('mail_enabled', config('mail.default') !== 'log'),
            'mail_mailer' => SystemSetting::get('mail_mailer', config('mail.default', 'smtp')),
            'mail_host' => SystemSetting::get('mail_host', config('mail.mailers.smtp.host', 'smtp.sendgrid.net')),
            'mail_port' => SystemSetting::get('mail_port', config('mail.mailers.smtp.port', 587)),
            'mail_username' => SystemSetting::get('mail_username', config('mail.mailers.smtp.username', 'apikey')),
            'mail_password' => SystemSetting::get('mail_password', config('mail.mailers.smtp.password', '')),
            'mail_encryption' => SystemSetting::get('mail_encryption', config('mail.mailers.smtp.encryption', 'tls')),
            'mail_from_address' => SystemSetting::get('mail_from_address', config('mail.from.address', '')),
            'mail_from_name' => SystemSetting::get('mail_from_name', config('mail.from.name', config('app.name'))),
        ];

        return Inertia::render('Admin/Settings/Email', [
            'settings' => $settings,
        ]);
    }

    public function updateEmail(Request $request)
    {
        $validated = $request->validate([
            'mail_enabled' => ['required', 'boolean'],
            'mail_mailer' => ['required', 'string', 'in:smtp,sendgrid,log'],
            'mail_host' => ['required_if:mail_mailer,smtp', 'nullable', 'string', 'max:255'],
            'mail_port' => ['required_if:mail_mailer,smtp', 'nullable', 'integer', 'min:1', 'max:65535'],
            'mail_username' => ['nullable', 'string', 'max:255'],
            'mail_password' => ['nullable', 'string', 'max:255'],
            'mail_encryption' => ['nullable', 'string', 'in:tls,ssl,null'],
            'mail_from_address' => ['required', 'email', 'max:255'],
            'mail_from_name' => ['required', 'string', 'max:255'],
        ]);

        // Map types for storage
        $typeMap = [
            'mail_enabled' => 'boolean',
            'mail_port' => 'integer',
        ];

        foreach ($validated as $key => $value) {
            $type = $typeMap[$key] ?? 'string';
            SystemSetting::set($key, $value, $type, 'email');
        }

        ActivityLog::log('settings.email_updated', null, [
            'mail_mailer' => $validated['mail_mailer'],
            'mail_from_address' => $validated['mail_from_address'],
        ]);

        return back()->with('success', 'Email settings updated successfully.');
    }

    public function generateApiToken(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $token = auth()->user()->createToken($validated['name']);

        ActivityLog::log('settings.api_token_created', null, ['token_name' => $validated['name']]);

        return back()->with('api_token', $token->plainTextToken);
    }

    public function revokeApiToken(int $tokenId)
    {
        auth()->user()->tokens()->where('id', $tokenId)->delete();

        ActivityLog::log('settings.api_token_revoked', null, ['token_id' => $tokenId]);

        return back()->with('success', 'API token revoked.');
    }

    public function scheduledTasks()
    {
        $settings = [
            'cron_monthly_report_enabled' => SystemSetting::get('cron_monthly_report_enabled', false),
            'cron_monthly_report_day' => SystemSetting::get('cron_monthly_report_day', 1),
            'cron_backup_enabled' => SystemSetting::get('cron_backup_enabled', false),
            'cron_backup_time' => SystemSetting::get('cron_backup_time', '02:00'),
            'cron_backup_retention_days' => SystemSetting::get('cron_backup_retention_days', 30),
            'google_drive_enabled' => SystemSetting::get('google_drive_enabled', false),
            'google_client_id' => SystemSetting::get('google_client_id', ''),
            'google_client_secret' => SystemSetting::get('google_client_secret', ''),
            'google_drive_folder_id' => SystemSetting::get('google_drive_folder_id', ''),
            'google_drive_connected_email' => SystemSetting::get('google_drive_connected_email', ''),
            'google_drive_connected' => !empty(SystemSetting::get('google_refresh_token', '')),
            'google_callback_url' => url('/settings/google-drive/callback'),
        ];

        // List existing backup files
        $backupDir = storage_path('app/backups');
        $backups = [];
        if (is_dir($backupDir)) {
            $files = glob($backupDir . '/backup-*.zip');
            rsort($files);
            foreach (array_slice($files, 0, 10) as $file) {
                $backups[] = [
                    'name' => basename($file),
                    'size' => round(filesize($file) / 1024 / 1024, 2) . ' MB',
                    'created_at' => date('Y-m-d H:i:s', filemtime($file)),
                ];
            }
        }

        return Inertia::render('Admin/Settings/ScheduledTasks', [
            'settings' => $settings,
            'backups' => $backups,
        ]);
    }

    public function updateScheduledTasks(Request $request)
    {
        $validated = $request->validate([
            'cron_monthly_report_enabled' => ['boolean'],
            'cron_monthly_report_day' => ['required', 'integer', 'min:1', 'max:28'],
            'cron_backup_enabled' => ['boolean'],
            'cron_backup_time' => ['required', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'cron_backup_retention_days' => ['required', 'integer', 'min:1', 'max:365'],
            'google_drive_enabled' => ['boolean'],
            'google_client_id' => ['nullable', 'string', 'max:255'],
            'google_client_secret' => ['nullable', 'string', 'max:255'],
            'google_drive_folder_id' => ['nullable', 'string', 'max:255'],
        ]);

        SystemSetting::set('cron_monthly_report_enabled', $validated['cron_monthly_report_enabled'] ?? false, 'boolean', 'cron');
        SystemSetting::set('cron_monthly_report_day', $validated['cron_monthly_report_day'], 'integer', 'cron');
        SystemSetting::set('cron_backup_enabled', $validated['cron_backup_enabled'] ?? false, 'boolean', 'cron');
        SystemSetting::set('cron_backup_time', $validated['cron_backup_time'], 'string', 'cron');
        SystemSetting::set('cron_backup_retention_days', $validated['cron_backup_retention_days'], 'integer', 'cron');
        SystemSetting::set('google_drive_enabled', $validated['google_drive_enabled'] ?? false, 'boolean', 'google');
        SystemSetting::set('google_client_id', $validated['google_client_id'] ?? '', 'string', 'google');
        SystemSetting::set('google_client_secret', $validated['google_client_secret'] ?? '', 'string', 'google');
        SystemSetting::set('google_drive_folder_id', $validated['google_drive_folder_id'] ?? '', 'string', 'google');

        ActivityLog::log('settings.cron_updated', null, $validated);

        return back()->with('success', 'Scheduled task settings updated.');
    }

    public function deleteBackup(string $filename)
    {
        if (!preg_match('/^backup-[\d\-]+\.zip$/', $filename)) {
            abort(404);
        }

        $path = storage_path('app/backups/' . $filename);

        if (!file_exists($path)) {
            return back()->with('error', 'Backup file not found.');
        }

        unlink($path);

        ActivityLog::log('settings.backup_deleted', null, ['filename' => $filename]);

        return back()->with('success', "Backup {$filename} deleted.");
    }

    public function downloadBackup(string $filename)
    {
        if (!preg_match('/^backup-[\d\-]+\.zip$/', $filename)) {
            abort(404);
        }

        $path = storage_path('app/backups/' . $filename);

        if (!file_exists($path)) {
            abort(404);
        }

        // Stream directly to avoid middleware/output-buffer conflicts
        return response()->streamDownload(function () use ($path) {
            $fp = fopen($path, 'rb');
            while (!feof($fp)) {
                echo fread($fp, 8192);
                flush();
            }
            fclose($fp);
        }, $filename, [
            'Content-Type'   => 'application/zip',
            'Content-Length' => filesize($path),
        ]);
    }

    public function listGoogleDriveBackups()
    {
        try {
            $drive   = new \App\Services\GoogleDriveService();
            $backups = $drive->listBackups();
            return response()->json($backups);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function restore(Request $request)
    {
        $validated = $request->validate([
            'source'   => ['required', 'in:local,google'],
            'filename' => ['required', 'string', 'max:255'],
        ]);

        $zipPath = null;
        $tmpFile = false;

        if ($validated['source'] === 'local') {
            if (!preg_match('/^backup-[\d\-]+\.zip$/', $validated['filename'])) {
                return back()->with('error', 'Invalid backup filename.');
            }
            $zipPath = storage_path('app/backups/' . $validated['filename']);
            if (!file_exists($zipPath)) {
                return back()->with('error', 'Backup file not found on server.');
            }
        } else {
            // Download from Google Drive to temp
            try {
                $drive   = new \App\Services\GoogleDriveService();
                $zipPath = $drive->downloadToTemp($validated['filename']); // filename = fileId for Drive
                $tmpFile = true;
            } catch (\Exception $e) {
                return back()->with('error', 'Failed to download from Google Drive: ' . $e->getMessage());
            }
        }

        \Artisan::call('app:restore-backup', ['zipPath' => $zipPath]);

        if ($tmpFile && file_exists($zipPath)) {
            unlink($zipPath);
        }

        ActivityLog::log('settings.backup_restored', null, [
            'source'   => $validated['source'],
            'filename' => $validated['filename'],
        ]);

        return back()->with('success', 'Backup restored successfully. Please verify the application is working correctly.');
    }

    public function uploadBackup(Request $request)
    {
        $request->validate([
            'backup_file' => ['required', 'file', 'mimes:zip', 'max:102400'],
        ]);

        $file = $request->file('backup_file');
        $original = $file->getClientOriginalName();

        $filename = preg_match('/^backup-[\d\-]+\.zip$/', $original)
            ? $original
            : 'backup-' . now()->format('Y-m-d-H-i-s') . '.zip';

        $backupDir = storage_path('app/backups');
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0775, true);
        }

        $file->move($backupDir, $filename);

        ActivityLog::log('settings.backup_uploaded', null, ['filename' => $filename]);

        return back()->with('success', "Backup '{$filename}' uploaded successfully.");
    }

    public function runBackupNow()
    {
        \Artisan::call('app:backup-database', ['--force' => true]);
        return back()->with('success', 'Backup complete. The file is now in the list below.');
    }

    public function exportDatabase()
    {
        $dbPath = database_path('database.sqlite');

        if (!file_exists($dbPath)) {
            return back()->with('error', 'Database file not found.');
        }

        ActivityLog::log('settings.database_exported', null);

        $filename = 'database-' . now()->format('Y-m-d-H-i-s') . '.sqlite';

        return response()->download($dbPath, $filename, [
            'Content-Type' => 'application/octet-stream',
        ]);
    }

    public function testEmail(Request $request)
    {
        try {
            $validated = $request->validate([
                'test_email' => ['required', 'email'],
            ]);

            // Configure mail settings from database (with .env fallback)
            $this->configureMailFromSettings();

            Mail::raw('This is a test email from ' . SystemSetting::getCompanyName() . '. If you received this email, your email configuration is working correctly.', function ($message) use ($validated) {
                $message->to($validated['test_email'])
                    ->subject('Test Email - ' . SystemSetting::getCompanyName());
            });

            return response()->json([
                'success' => true,
                'message' => 'Test email sent successfully to ' . $validated['test_email'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email address provided.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Test email failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send test email: ' . $e->getMessage(),
            ], 500);
        }
    }

    protected function configureMailFromSettings()
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
}
