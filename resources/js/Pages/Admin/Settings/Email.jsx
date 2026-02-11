import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Settings, Calendar, Building2, Mail, Save, Send, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function EmailSettings({ settings }) {
    const [showPassword, setShowPassword] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testStatus, setTestStatus] = useState(null);
    const [isTesting, setIsTesting] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        mail_enabled: settings.mail_enabled || false,
        mail_mailer: settings.mail_mailer || 'smtp',
        mail_host: settings.mail_host || 'smtp.sendgrid.net',
        mail_port: settings.mail_port || 587,
        mail_username: settings.mail_username || 'apikey',
        mail_password: settings.mail_password || '',
        mail_encryption: settings.mail_encryption || 'tls',
        mail_from_address: settings.mail_from_address || '',
        mail_from_name: settings.mail_from_name || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/settings/email');
    };

    const handleTestEmail = async () => {
        if (!testEmail) {
            setTestStatus({ type: 'error', message: 'Please enter a test email address' });
            return;
        }

        setIsTesting(true);
        setTestStatus(null);

        try {
            const response = await window.axios.post('/settings/email/test', { test_email: testEmail });
            setTestStatus({ type: 'success', message: response.data.message || 'Test email sent successfully!' });
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to send test email';
            setTestStatus({ type: 'error', message });
        }

        setIsTesting(false);
    };

    const presets = {
        sendgrid: {
            mail_host: 'smtp.sendgrid.net',
            mail_port: 587,
            mail_username: 'apikey',
            mail_encryption: 'tls',
        },
        gmail: {
            mail_host: 'smtp.gmail.com',
            mail_port: 587,
            mail_username: '',
            mail_encryption: 'tls',
        },
        mailgun: {
            mail_host: 'smtp.mailgun.org',
            mail_port: 587,
            mail_username: '',
            mail_encryption: 'tls',
        },
        ses: {
            mail_host: 'email-smtp.us-east-1.amazonaws.com',
            mail_port: 587,
            mail_username: '',
            mail_encryption: 'tls',
        },
    };

    const applyPreset = (preset) => {
        if (presets[preset]) {
            setData({
                ...data,
                ...presets[preset],
                mail_password: '', // Clear password when changing preset
            });
        }
    };

    return (
        <AuthenticatedLayout title="Email Settings">
            <Head title="Email Settings" />

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
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
                        href="/settings/email"
                        className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
                    >
                        <Mail className="h-4 w-4" />
                        Email
                    </a>
                </nav>
            </div>

            <div className="max-w-3xl">
                <form onSubmit={handleSubmit}>
                    <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
                        {/* Enable/Disable Email */}
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Enable or disable email notifications for leave requests and approvals.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setData('mail_enabled', !data.mail_enabled)}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                        data.mail_enabled ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                            data.mail_enabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Provider Selection */}
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Email Provider</h3>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="mail_mailer" className="block text-sm font-medium text-gray-700">
                                        Mail Driver
                                    </label>
                                    <select
                                        id="mail_mailer"
                                        value={data.mail_mailer}
                                        onChange={(e) => setData('mail_mailer', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    >
                                        <option value="smtp">SMTP</option>
                                        <option value="log">Log (Testing)</option>
                                    </select>
                                    {errors.mail_mailer && (
                                        <p className="mt-1 text-sm text-red-600">{errors.mail_mailer}</p>
                                    )}
                                </div>

                                {data.mail_mailer === 'smtp' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Quick Setup
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => applyPreset('sendgrid')}
                                                className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                                            >
                                                SendGrid
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyPreset('gmail')}
                                                className="px-3 py-1.5 text-sm font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                            >
                                                Gmail
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyPreset('mailgun')}
                                                className="px-3 py-1.5 text-sm font-medium rounded-md bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
                                            >
                                                Mailgun
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyPreset('ses')}
                                                className="px-3 py-1.5 text-sm font-medium rounded-md bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
                                            >
                                                Amazon SES
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SMTP Settings */}
                        {data.mail_mailer === 'smtp' && (
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">SMTP Configuration</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="mail_host" className="block text-sm font-medium text-gray-700">
                                            SMTP Host
                                        </label>
                                        <input
                                            type="text"
                                            id="mail_host"
                                            value={data.mail_host}
                                            onChange={(e) => setData('mail_host', e.target.value)}
                                            placeholder="smtp.sendgrid.net"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                        {errors.mail_host && (
                                            <p className="mt-1 text-sm text-red-600">{errors.mail_host}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="mail_port" className="block text-sm font-medium text-gray-700">
                                            SMTP Port
                                        </label>
                                        <input
                                            type="number"
                                            id="mail_port"
                                            value={data.mail_port}
                                            onChange={(e) => setData('mail_port', parseInt(e.target.value))}
                                            placeholder="587"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                        {errors.mail_port && (
                                            <p className="mt-1 text-sm text-red-600">{errors.mail_port}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="mail_username" className="block text-sm font-medium text-gray-700">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            id="mail_username"
                                            value={data.mail_username}
                                            onChange={(e) => setData('mail_username', e.target.value)}
                                            placeholder="apikey"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            For SendGrid, use "apikey" as the username
                                        </p>
                                        {errors.mail_username && (
                                            <p className="mt-1 text-sm text-red-600">{errors.mail_username}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="mail_password" className="block text-sm font-medium text-gray-700">
                                            Password / API Key
                                        </label>
                                        <div className="relative mt-1">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                id="mail_password"
                                                value={data.mail_password}
                                                onChange={(e) => setData('mail_password', e.target.value)}
                                                placeholder="Your API key or password"
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            For SendGrid, use your API key as the password
                                        </p>
                                        {errors.mail_password && (
                                            <p className="mt-1 text-sm text-red-600">{errors.mail_password}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="mail_encryption" className="block text-sm font-medium text-gray-700">
                                            Encryption
                                        </label>
                                        <select
                                            id="mail_encryption"
                                            value={data.mail_encryption}
                                            onChange={(e) => setData('mail_encryption', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        >
                                            <option value="tls">TLS</option>
                                            <option value="ssl">SSL</option>
                                            <option value="null">None</option>
                                        </select>
                                        {errors.mail_encryption && (
                                            <p className="mt-1 text-sm text-red-600">{errors.mail_encryption}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sender Information */}
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Sender Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="mail_from_address" className="block text-sm font-medium text-gray-700">
                                        From Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="mail_from_address"
                                        value={data.mail_from_address}
                                        onChange={(e) => setData('mail_from_address', e.target.value)}
                                        placeholder="noreply@yourdomain.com"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Must be a verified sender in your email provider
                                    </p>
                                    {errors.mail_from_address && (
                                        <p className="mt-1 text-sm text-red-600">{errors.mail_from_address}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="mail_from_name" className="block text-sm font-medium text-gray-700">
                                        From Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="mail_from_name"
                                        value={data.mail_from_name}
                                        onChange={(e) => setData('mail_from_name', e.target.value)}
                                        placeholder="HR Leave System"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        required
                                    />
                                    {errors.mail_from_name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.mail_from_name}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Test Email */}
                        <div className="p-6 bg-gray-50">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Test Configuration</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Save your settings first, then send a test email to verify the configuration.
                            </p>
                            <div className="flex gap-3">
                                <input
                                    type="email"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    placeholder="Enter test email address"
                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={handleTestEmail}
                                    disabled={isTesting || !data.mail_enabled}
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                >
                                    <Send className="h-4 w-4" />
                                    {isTesting ? 'Sending...' : 'Send Test'}
                                </button>
                            </div>

                            {testStatus && (
                                <div
                                    className={`mt-3 flex items-center gap-2 p-3 rounded-md ${
                                        testStatus.type === 'success'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                    {testStatus.type === 'success' ? (
                                        <CheckCircle className="h-5 w-5" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5" />
                                    )}
                                    <span className="text-sm">{testStatus.message}</span>
                                </div>
                            )}

                            {!data.mail_enabled && (
                                <p className="mt-2 text-sm text-amber-600">
                                    Enable email notifications above to test the configuration.
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
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
                </form>

                {/* Help Section */}
                <div className="mt-6 bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">SendGrid Setup Instructions</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Create a SendGrid account at <span className="font-mono">sendgrid.com</span></li>
                        <li>Go to Settings &rarr; API Keys and create a new API key with "Mail Send" permission</li>
                        <li>Click "SendGrid" above to auto-fill the SMTP settings</li>
                        <li>Paste your API key in the "Password / API Key" field</li>
                        <li>Verify your sender email address in SendGrid's Sender Authentication</li>
                        <li>Save settings and send a test email to verify</li>
                    </ol>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
