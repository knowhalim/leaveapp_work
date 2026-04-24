import { Head, useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Settings, Calendar, Building2, Mail, MailOpen, Clock, Database, Save, Download, Play, RefreshCw, ExternalLink, CheckCircle, AlertCircle, Eye, EyeOff, PlayCircle, Copy, Check, Terminal, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';

export default function ScheduledTasks({ settings, backups = [] }) {
    const { flash } = usePage().props;
    const [runningBackup, setRunningBackup] = useState(false);
    const [showClientSecret, setShowClientSecret] = useState(false);
    const [copiedCron, setCopiedCron] = useState(false);
    const [copiedCallback, setCopiedCallback] = useState(false);
    const [restoreTab, setRestoreTab] = useState('local');
    const [driveBackups, setDriveBackups] = useState(null);
    const [driveLoading, setDriveLoading] = useState(false);
    const [driveError, setDriveError] = useState(null);
    const [restoring, setRestoring] = useState(false);
    const [uploadExpanded, setUploadExpanded] = useState(false);
    const { data: uploadData, setData: setUploadData, post: uploadPost, processing: uploadProcessing, errors: uploadErrors, reset: resetUpload } = useForm({ backup_file: null });

    const loadDriveBackups = () => {
        setDriveLoading(true);
        setDriveError(null);
        fetch('/settings/backups/google-drive/list', { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } })
            .then(r => r.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                setDriveBackups(data);
            })
            .catch(e => setDriveError(e.message))
            .finally(() => setDriveLoading(false));
    };

    const handleDeleteBackup = (filename) => {
        if (!confirm(`Delete backup "${filename}"?\n\nThis cannot be undone.`)) return;
        router.delete(`/settings/backups/${filename}`);
    };

    const handleRestore = (source, filename, displayName) => {
        if (!confirm(`⚠️ Restore from "${displayName}"?\n\nThis will REPLACE your current database and attachments. This cannot be undone.\n\nMake sure you have a recent backup before proceeding.`)) return;
        setRestoring(true);
        router.post('/settings/backups/restore', { source, filename }, {
            onFinish: () => setRestoring(false),
        });
    };

    const cronCommand = '* * * * * sudo -u www-data bash -c "cd /var/www/simplehrleave && php artisan schedule:run" >> /var/log/laravel-scheduler.log 2>&1';

    const handleCopyCron = () => {
        navigator.clipboard.writeText(cronCommand);
        setCopiedCron(true);
        setTimeout(() => setCopiedCron(false), 2000);
    };

    const handleCopyCallback = () => {
        navigator.clipboard.writeText(settings.google_callback_url || '');
        setCopiedCallback(true);
        setTimeout(() => setCopiedCallback(false), 2000);
    };

    const { data, setData, post, processing, errors } = useForm({
        cron_monthly_report_enabled: settings.cron_monthly_report_enabled ?? false,
        cron_monthly_report_day: settings.cron_monthly_report_day ?? 1,
        cron_backup_enabled: settings.cron_backup_enabled ?? false,
        cron_backup_time: settings.cron_backup_time ?? '02:00',
        cron_backup_retention_days: settings.cron_backup_retention_days ?? 30,
        google_drive_enabled: settings.google_drive_enabled ?? false,
        google_client_id: settings.google_client_id ?? '',
        google_client_secret: settings.google_client_secret ?? '',
        google_drive_folder_id: settings.google_drive_folder_id ?? '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/settings/scheduled-tasks');
    };

    const handleRunBackupNow = () => {
        if (confirm('Run a backup now? This may take a few seconds.')) {
            setRunningBackup(true);
            router.post(
                '/settings/backups/run-now',
                {},
                {
                    onFinish: () => setRunningBackup(false),
                }
            );
        }
    };

    const handleDisconnectDrive = () => {
        if (confirm('Disconnect Google Drive? Future backups will no longer be uploaded to Drive.')) {
            router.delete('/settings/google-drive/disconnect');
        }
    };

    // Day-of-month options (1–28)
    const dayOptions = Array.from({ length: 28 }, (_, i) => i + 1);

    return (
        <AuthenticatedLayout title="Scheduled Tasks">
            <Head title="Scheduled Tasks" />

            {/* Flash success message */}
            {flash?.success && (
                <div className="mb-4 rounded-md bg-green-50 p-4 border border-green-200">
                    <p className="text-sm text-green-800">{flash.success}</p>
                </div>
            )}

            {/* Flash error message */}
            {flash?.error && (
                <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
                    <p className="text-sm text-red-800">{flash.error}</p>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto">
                    <a
                        href="/settings"
                        className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
                    >
                        <Settings className="h-4 w-4" />
                        General
                    </a>
                    <a
                        href="/settings/holidays"
                        className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
                    >
                        <Calendar className="h-4 w-4" />
                        Public Holidays
                    </a>
                    <a
                        href="/settings/employee-types"
                        className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
                    >
                        <Building2 className="h-4 w-4" />
                        Employee Types
                    </a>
                    <a
                        href="/settings/email-templates"
                        className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
                    >
                        <MailOpen className="h-4 w-4" />
                        Email Templates
                    </a>
                    <a
                        href="/settings/email"
                        className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
                    >
                        <Mail className="h-4 w-4" />
                        Email
                    </a>
                    <a
                        href="/settings/scheduled-tasks"
                        className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
                    >
                        <Clock className="h-4 w-4" />
                        Scheduled Tasks
                    </a>
                </nav>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">

                {/* Monthly Admin Report Card */}
                <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-1">
                            <Mail className="h-5 w-5 text-indigo-600" />
                            <h3 className="text-lg font-medium text-gray-900">Monthly Admin Report</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            Automatically email a monthly leave summary to all active admins and super admins.
                        </p>

                        {/* Enable toggle */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Enable Monthly Report</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    When enabled, the report will be sent on the selected day each month.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setData('cron_monthly_report_enabled', !data.cron_monthly_report_enabled)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                    data.cron_monthly_report_enabled ? 'bg-indigo-600' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        data.cron_monthly_report_enabled ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Day of month */}
                        <div className="max-w-xs">
                            <label htmlFor="cron_monthly_report_day" className="block text-sm font-medium text-gray-700">
                                Send on Day of Month
                            </label>
                            <select
                                id="cron_monthly_report_day"
                                value={data.cron_monthly_report_day}
                                onChange={(e) => setData('cron_monthly_report_day', parseInt(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                disabled={!data.cron_monthly_report_enabled}
                            >
                                {dayOptions.map((day) => (
                                    <option key={day} value={day}>
                                        {day}
                                    </option>
                                ))}
                            </select>
                            {errors.cron_monthly_report_day && (
                                <p className="mt-1 text-sm text-red-600">{errors.cron_monthly_report_day}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                Report will be sent at 08:00 on this day. The report covers the previous calendar month.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-b-lg flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>

                {/* Daily Database Backup Card */}
                <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-1">
                            <Database className="h-5 w-5 text-indigo-600" />
                            <h3 className="text-lg font-medium text-gray-900">Daily Database Backup</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            Automatically create a zip backup of the SQLite database and leave attachments each day.
                        </p>

                        {/* Enable toggle */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Enable Daily Backup</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Backup will run once daily at the configured time.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setData('cron_backup_enabled', !data.cron_backup_enabled)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                    data.cron_backup_enabled ? 'bg-indigo-600' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        data.cron_backup_enabled ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Backup time */}
                            <div>
                                <label htmlFor="cron_backup_time" className="block text-sm font-medium text-gray-700">
                                    Backup Time (HH:MM)
                                </label>
                                <input
                                    type="time"
                                    id="cron_backup_time"
                                    value={data.cron_backup_time}
                                    onChange={(e) => setData('cron_backup_time', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    disabled={!data.cron_backup_enabled}
                                />
                                {errors.cron_backup_time && (
                                    <p className="mt-1 text-sm text-red-600">{errors.cron_backup_time}</p>
                                )}
                            </div>

                            {/* Retention days */}
                            <div>
                                <label htmlFor="cron_backup_retention_days" className="block text-sm font-medium text-gray-700">
                                    Retention Period (days)
                                </label>
                                <input
                                    type="number"
                                    id="cron_backup_retention_days"
                                    value={data.cron_backup_retention_days}
                                    onChange={(e) => setData('cron_backup_retention_days', parseInt(e.target.value))}
                                    min={1}
                                    max={365}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                {errors.cron_backup_retention_days && (
                                    <p className="mt-1 text-sm text-red-600">{errors.cron_backup_retention_days}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Backups older than this many days will be deleted automatically.
                                </p>
                            </div>
                        </div>

                        {/* Google Drive Section */}
                        <div className="mt-6 pt-6 border-t border-gray-200">

                            {/* Google Drive toggle */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Backup to Google Drive</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Automatically upload each backup zip to your Google Drive.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setData('google_drive_enabled', !data.google_drive_enabled)}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                        data.google_drive_enabled ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                            data.google_drive_enabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Google Drive expanded section */}
                            {data.google_drive_enabled && (
                                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 space-y-4">

                                    {settings.google_drive_connected ? (
                                        /* Connected state */
                                        <div className="flex items-center justify-between flex-wrap gap-3">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-medium text-green-800">
                                                        Connected as {settings.google_drive_connected_email}
                                                    </p>
                                                    <p className="text-xs text-green-700 mt-0.5">
                                                        Backups will be uploaded to this Google Drive account.
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleDisconnectDrive}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                Disconnect
                                            </button>
                                        </div>
                                    ) : (
                                        /* Not connected — show credential fields */
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-2 p-3 bg-white border border-indigo-200 rounded-md">
                                                <AlertCircle className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs text-indigo-700">
                                                    Enter your Google OAuth credentials below, save settings, then click "Connect Google Drive" to authorize.
                                                </p>
                                            </div>

                                            {/* Authorized Redirect URI (callback URL) */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Authorized Redirect URI
                                                </label>
                                                <div className="mt-1 flex rounded-md shadow-sm">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={settings.google_callback_url || ''}
                                                        onFocus={(e) => e.target.select()}
                                                        className="block w-full rounded-l-md border-gray-300 bg-gray-50 text-gray-700 sm:text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleCopyCallback}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                    >
                                                        {copiedCallback ? (
                                                            <>
                                                                <Check className="h-3.5 w-3.5 text-green-600" />
                                                                Copied
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="h-3.5 w-3.5" />
                                                                Copy
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Paste this into your Google Cloud Console OAuth client under "Authorized redirect URIs".
                                                </p>
                                            </div>

                                            {/* Client ID */}
                                            <div>
                                                <label htmlFor="google_client_id" className="block text-sm font-medium text-gray-700">
                                                    Google Client ID
                                                </label>
                                                <input
                                                    type="text"
                                                    id="google_client_id"
                                                    value={data.google_client_id}
                                                    onChange={(e) => setData('google_client_id', e.target.value)}
                                                    placeholder="123456789-abc...apps.googleusercontent.com"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                />
                                                {errors.google_client_id && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.google_client_id}</p>
                                                )}
                                            </div>

                                            {/* Client Secret */}
                                            <div>
                                                <label htmlFor="google_client_secret" className="block text-sm font-medium text-gray-700">
                                                    Google Client Secret
                                                </label>
                                                <div className="mt-1 relative">
                                                    <input
                                                        type={showClientSecret ? 'text' : 'password'}
                                                        id="google_client_secret"
                                                        value={data.google_client_secret}
                                                        onChange={(e) => setData('google_client_secret', e.target.value)}
                                                        placeholder="GOCSPX-..."
                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowClientSecret(!showClientSecret)}
                                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                                    >
                                                        {showClientSecret ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                                {errors.google_client_secret && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.google_client_secret}</p>
                                                )}
                                            </div>

                                            {/* Drive Folder ID */}
                                            <div>
                                                <label htmlFor="google_drive_folder_id" className="block text-sm font-medium text-gray-700">
                                                    Drive Folder ID <span className="font-normal text-gray-500">(optional)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id="google_drive_folder_id"
                                                    value={data.google_drive_folder_id}
                                                    onChange={(e) => setData('google_drive_folder_id', e.target.value)}
                                                    placeholder="Leave empty for root Drive"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                />
                                                {errors.google_drive_folder_id && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.google_drive_folder_id}</p>
                                                )}
                                                <p className="mt-1 text-xs text-gray-500">
                                                    The ID from the Google Drive folder URL, e.g. drive.google.com/drive/folders/<strong>FOLDER_ID</strong>
                                                </p>
                                            </div>

                                            {/* Connect button (only visible when client_id is populated) */}
                                            <div className="pt-1">
                                                {data.google_client_id.trim() !== '' ? (
                                                    <a
                                                        href="/settings/google-drive/connect"
                                                        className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                        Connect Google Drive
                                                    </a>
                                                ) : (
                                                    <p className="text-xs text-gray-500 italic">
                                                        Save your credentials first, then the Connect button will appear here.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-b-lg flex items-center justify-between flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={handleRunBackupNow}
                            disabled={runningBackup}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {runningBackup ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                            {runningBackup ? 'Running...' : 'Run Backup Now'}
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>

            </form>

            {/* Setup Guide Section */}
            <div className="max-w-3xl mt-6">
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Google Drive Setup Guide</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Need help configuring Google Drive backup? Follow the step-by-step guide or watch the video tutorial.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <a
                            href="/settings/google-drive-tutorial"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-indigo-300 rounded-md text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <ExternalLink className="h-4 w-4" />
                            View Setup Tutorial (PDF)
                        </a>
                        <a
                            href="#placeholderyoutubetutorial"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <PlayCircle className="h-4 w-4" />
                            Watch Video Tutorial
                        </a>
                    </div>
                </div>
            </div>

            {/* Recent Backups Table */}
            <div className="max-w-3xl mt-6">
                <div className="bg-white shadow rounded-lg">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Recent Backups</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            The 10 most recent backup files stored on the server.
                        </p>
                    </div>

                    {backups.length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-500">
                            No backups found. Run a backup or enable the daily schedule to get started.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Filename
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Size
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {backups.map((backup) => (
                                        <tr key={backup.name} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-mono text-gray-900 whitespace-nowrap">
                                                {backup.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                {backup.size}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                {backup.created_at}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-3">
                                                    <a
                                                        href={`/settings/backups/${backup.name}`}
                                                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        Download
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteBackup(backup.name)}
                                                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-medium"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Backup */}
            <div className="max-w-3xl mt-6">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setUploadExpanded(!uploadExpanded)}
                        className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50"
                    >
                        <div className="flex items-center gap-3">
                            <Upload className="h-5 w-5 text-indigo-600" />
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Upload a Backup</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Upload a backup zip file from your computer to this server.</p>
                            </div>
                        </div>
                        <span className="text-gray-400 text-sm">{uploadExpanded ? '▲' : '▼'}</span>
                    </button>

                    {uploadExpanded && (
                        <div className="px-6 pb-6 border-t border-gray-100">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    uploadPost('/settings/backups/upload', {
                                        forceFormData: true,
                                        onSuccess: () => { resetUpload(); setUploadExpanded(false); },
                                    });
                                }}
                                className="mt-4 space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Backup file (.zip)
                                    </label>
                                    <input
                                        type="file"
                                        accept=".zip"
                                        onChange={(e) => setUploadData('backup_file', e.target.files[0])}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    {uploadErrors.backup_file && (
                                        <p className="mt-1 text-sm text-red-600">{uploadErrors.backup_file}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">Max 100 MB. Must be a .zip file.</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={uploadProcessing || !uploadData.backup_file}
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {uploadProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    {uploadProcessing ? 'Uploading...' : 'Upload Backup'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Restore Backup */}
            <div className="max-w-3xl mt-6">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3 mb-1">
                            <RefreshCw className="h-5 w-5 text-orange-500" />
                            <h3 className="text-lg font-medium text-gray-900">Restore a Backup</h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            Select a backup file to restore. This will replace your current database and attachments.
                        </p>
                        <div className="mt-3 flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-orange-800">
                                <strong>Warning:</strong> Restoring a backup will overwrite all current data. This action cannot be undone. We recommend running a fresh backup first.
                            </p>
                        </div>
                    </div>

                    {/* Source tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            <button
                                type="button"
                                onClick={() => setRestoreTab('local')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors ${restoreTab === 'local' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-gray-50 text-gray-500 hover:text-gray-700'}`}
                            >
                                This Server ({backups.length} file{backups.length !== 1 ? 's' : ''})
                            </button>
                            {settings.google_drive_connected && (
                                <button
                                    type="button"
                                    onClick={() => { setRestoreTab('google'); if (!driveBackups) loadDriveBackups(); }}
                                    className={`flex-1 py-3 text-sm font-medium transition-colors ${restoreTab === 'google' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-gray-50 text-gray-500 hover:text-gray-700'}`}
                                >
                                    Google Drive
                                </button>
                            )}
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Local tab */}
                        {restoreTab === 'local' && (
                            <>
                                {backups.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-gray-500">
                                        <Database className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                        No local backups found. Run a backup first using the button above.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {backups.map((backup) => (
                                            <div key={backup.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 font-mono break-all">{backup.name}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{backup.size} · {backup.created_at}</p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0 sm:ml-4 flex-wrap">
                                                    <a
                                                        href={`/settings/backups/${backup.name}`}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-50"
                                                    >
                                                        <Download className="h-3.5 w-3.5" />
                                                        Download
                                                    </a>
                                                    <button
                                                        type="button"
                                                        disabled={restoring}
                                                        onClick={() => handleRestore('local', backup.name, backup.name)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-700 border border-orange-200 rounded-md hover:bg-orange-50 disabled:opacity-50"
                                                    >
                                                        <RefreshCw className={`h-3.5 w-3.5 ${restoring ? 'animate-spin' : ''}`} />
                                                        Restore
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteBackup(backup.name)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 border border-red-200 rounded-md hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Google Drive tab */}
                        {restoreTab === 'google' && (
                            <>
                                {driveLoading && (
                                    <div className="text-center py-8 text-sm text-gray-500">
                                        <RefreshCw className="h-6 w-6 text-gray-400 mx-auto mb-2 animate-spin" />
                                        Loading backups from Google Drive...
                                    </div>
                                )}
                                {driveError && (
                                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-red-800">Could not load Google Drive backups</p>
                                            <p className="text-xs text-red-700 mt-0.5">{driveError}</p>
                                            <button type="button" onClick={loadDriveBackups} className="text-xs text-red-600 underline mt-1">Try again</button>
                                        </div>
                                    </div>
                                )}
                                {!driveLoading && !driveError && driveBackups !== null && (
                                    driveBackups.length === 0 ? (
                                        <div className="text-center py-8 text-sm text-gray-500">
                                            No backup files found in Google Drive.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {driveBackups.map((backup) => (
                                                <div key={backup.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 font-mono break-all">{backup.name}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{backup.size} · {new Date(backup.created_at).toLocaleString()}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        disabled={restoring}
                                                        onClick={() => handleRestore('google', backup.id, backup.name)}
                                                        className="flex-shrink-0 sm:ml-4 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-700 border border-orange-200 rounded-md hover:bg-orange-50 disabled:opacity-50"
                                                    >
                                                        <RefreshCw className={`h-3.5 w-3.5 ${restoring ? 'animate-spin' : ''}`} />
                                                        Restore
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Cron Setup Guide — non-IT friendly */}
            <div className="max-w-3xl mt-6 mb-8">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex items-start gap-3">
                        <Terminal className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-amber-900">One-time setup required to activate automatic tasks</h4>
                            <p className="text-sm text-amber-700 mt-1">
                                Think of this like setting up an alarm clock on your server. Without this step, the automatic backup and report schedules above <strong>will not run</strong> — you'll only be able to trigger them manually.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* What is a cron job — plain English */}
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                <strong>What is this?</strong> A "cron job" is an instruction you give to your server to check every minute whether any scheduled task needs to run — like your backup or monthly report. You only need to set it up once and it works forever in the background.
                            </p>
                        </div>

                        {/* Steps */}
                        <div>
                            <p className="text-sm font-semibold text-gray-900 mb-4">How to set it up (ask your server provider or IT person to do steps 2–4):</p>
                            <ol className="space-y-4">
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">1</span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">Copy the command below</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Click the "Copy" button — you'll need this exact text.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">2</span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">Log into your server via SSH</p>
                                        <p className="text-xs text-gray-500 mt-0.5">This is like a remote control terminal for your server. Your hosting provider can help if you're unsure.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">3</span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">Type <code className="bg-gray-100 px-1 rounded text-xs font-mono">crontab -e</code> and press Enter</p>
                                        <p className="text-xs text-gray-500 mt-0.5">This opens a list of scheduled tasks on your server.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">4</span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">Paste the command at the bottom of the file and save</p>
                                        <p className="text-xs text-gray-500 mt-0.5">If using the <em>nano</em> editor: paste the line, press <strong>Ctrl+X</strong>, then <strong>Y</strong>, then <strong>Enter</strong> to save.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 text-green-700 text-sm font-bold flex items-center justify-center">✓</span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">That's it! The scheduler will now run every minute in the background.</p>
                                        <p className="text-xs text-gray-500 mt-0.5">You don't need to repeat this. It survives server restarts automatically.</p>
                                    </div>
                                </li>
                            </ol>
                        </div>

                        {/* The command with copy button */}
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">The command to copy:</p>
                            <div className="flex items-stretch gap-2">
                                <div className="flex-1 bg-gray-900 rounded-lg px-4 py-3 overflow-x-auto">
                                    <code className="text-green-400 text-xs font-mono whitespace-nowrap">
                                        {cronCommand}
                                    </code>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopyCron}
                                    className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        copiedCron
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {copiedCron ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    {copiedCron ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        {/* Already done notice */}
                        <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-green-800">
                                <strong>If you are using this app on the provided server (107.174.68.20):</strong> This has already been set up for you. No action needed.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
