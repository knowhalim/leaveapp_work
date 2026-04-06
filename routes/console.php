<?php

use App\Models\SystemSetting;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Monthly admin report — runs daily at 08:00, checks if today is the configured day
Schedule::command('app:send-monthly-admin-report')
    ->dailyAt('08:00')
    ->when(function () {
        $enabled = SystemSetting::get('cron_monthly_report_enabled', false);
        $day = (int) SystemSetting::get('cron_monthly_report_day', 1);
        return $enabled && now()->day === $day;
    });

// Annual leave year rollover — runs at 00:05 on the 1st of the configured leave_year_start_month
Schedule::command('app:rollover-leave-year')
    ->dailyAt('00:05')
    ->when(function () {
        try {
            $startMonth = (int) SystemSetting::get('leave_year_start_month', 1);
            return now()->day === 1 && now()->month === $startMonth;
        } catch (\Exception $e) {
            return false;
        }
    });

// Daily backup
// SystemSetting::get() is evaluated immediately as a dailyAt() argument (not lazy),
// so guard against fresh installs where system_settings table doesn't exist yet.
$backupTime = '02:00';
try {
    $backupTime = SystemSetting::get('cron_backup_time', '02:00') ?? '02:00';
} catch (\Exception $e) {
    // Table doesn't exist yet (fresh install before migrations run)
}
Schedule::command('app:backup-database')
    ->dailyAt($backupTime)
    ->when(fn () => (bool) SystemSetting::get('cron_backup_enabled', false));
