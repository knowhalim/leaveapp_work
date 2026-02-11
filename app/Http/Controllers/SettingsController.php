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
        ];

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
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
        ]);

        foreach ($validated as $key => $value) {
            $type = is_array($value) ? 'array' : (is_int($value) ? 'integer' : 'string');
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

    public function testEmail(Request $request)
    {
        try {
            $validated = $request->validate([
                'test_email' => ['required', 'email'],
            ]);

            // Configure mail settings from database (with .env fallback)
            $this->configureMailFromSettings();

            Mail::raw('This is a test email from ' . SystemSetting::get('company_name', 'HR Leave System') . '. If you received this email, your email configuration is working correctly.', function ($message) use ($validated) {
                $message->to($validated['test_email'])
                    ->subject('Test Email - HR Leave System');
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
            'mail.from.name' => SystemSetting::get('mail_from_name', config('mail.from.name', config('app.name'))),
        ]);

        // Purge cached mailer instances so new config takes effect
        Mail::forgetMailers();
    }
}
