import { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Settings, Calendar, Building2, Mail, MailOpen, Save, Database, Key, Plus, Trash2, Copy, Check, Clock, BookOpen, X, ChevronDown, ChevronRight, Lock, Zap } from 'lucide-react';

export default function SettingsIndex({ settings, apiTokens = [] }) {
    const { auth, flash } = usePage().props;
    const isSuperAdmin = auth.user?.role === 'super_admin';
    const [copiedToken, setCopiedToken] = useState(false);
    const [newTokenName, setNewTokenName] = useState('');
    const [showApiDocs, setShowApiDocs] = useState(false);
    const [copiedCurl, setCopiedCurl] = useState(null);
    const [expandedEndpoint, setExpandedEndpoint] = useState(null);

    const newToken = flash?.api_token;

    const handleCopyToken = () => {
        navigator.clipboard.writeText(newToken);
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
    };

    const handleGenerateToken = (e) => {
        e.preventDefault();
        router.post('/settings/api-tokens', { name: newTokenName }, {
            onSuccess: () => setNewTokenName(''),
        });
    };

    const handleRevokeToken = (tokenId) => {
        if (confirm('Revoke this API token? Any integrations using it will stop working.')) {
            router.delete(`/settings/api-tokens/${tokenId}`);
        }
    };

    const { data, setData, post, processing, errors } = useForm({
        company_name: settings.company_name || '',
        financial_year: settings.financial_year || new Date().getFullYear().toString(),
        weekends: settings.weekends || ['saturday', 'sunday'],
        max_carry_forward: settings.max_carry_forward || 5,
        leave_year_start_month: settings.leave_year_start_month || 1,
        role_label_employee: settings.role_label_employee || 'Employee',
        role_label_manager: settings.role_label_manager || 'Manager',
        role_label_admin: settings.role_label_admin || 'Admin',
        role_label_super_admin: settings.role_label_super_admin || 'Super Admin',
        password_login_enabled: settings.password_login_enabled ?? true,
    });

    const weekdays = [
        { value: 'sunday', label: 'Sunday' },
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
    ];

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];

    const handleWeekendToggle = (day) => {
        if (data.weekends.includes(day)) {
            setData('weekends', data.weekends.filter(d => d !== day));
        } else {
            setData('weekends', [...data.weekends, day]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/settings');
    };

    return (
        <AuthenticatedLayout title="System Settings">
            <Head title="System Settings" />

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <a
                        href="/settings"
                        className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
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
                    {isSuperAdmin && (
                        <a
                            href="/settings/email"
                            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
                        >
                            <Mail className="h-4 w-4" />
                            Email
                        </a>
                    )}
                    {isSuperAdmin && (
                        <a
                            href="/settings/scheduled-tasks"
                            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
                        >
                            <Clock className="h-4 w-4" />
                            Scheduled Tasks
                        </a>
                    )}
                </nav>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl">
                <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
                    {/* Company Information */}
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    id="company_name"
                                    value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                {errors.company_name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.company_name}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Leave Year Settings */}
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Leave Year Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="financial_year" className="block text-sm font-medium text-gray-700">
                                    Financial Year
                                </label>
                                <input
                                    type="text"
                                    id="financial_year"
                                    value={data.financial_year}
                                    onChange={(e) => setData('financial_year', e.target.value)}
                                    placeholder="e.g., 2024 or 2024-2025"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                {errors.financial_year && (
                                    <p className="mt-1 text-sm text-red-600">{errors.financial_year}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="leave_year_start_month" className="block text-sm font-medium text-gray-700">
                                    Leave Year Start Month
                                </label>
                                <select
                                    id="leave_year_start_month"
                                    value={data.leave_year_start_month}
                                    onChange={(e) => setData('leave_year_start_month', parseInt(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                >
                                    {months.map((month) => (
                                        <option key={month.value} value={month.value}>
                                            {month.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.leave_year_start_month && (
                                    <p className="mt-1 text-sm text-red-600">{errors.leave_year_start_month}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="max_carry_forward" className="block text-sm font-medium text-gray-700">
                                    Max Carry Forward Days
                                </label>
                                <input
                                    type="number"
                                    id="max_carry_forward"
                                    min="0"
                                    value={data.max_carry_forward}
                                    onChange={(e) => setData('max_carry_forward', parseInt(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                {errors.max_carry_forward && (
                                    <p className="mt-1 text-sm text-red-600">{errors.max_carry_forward}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Weekend Settings */}
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Weekend Days</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Select the days that should be considered weekends (non-working days).
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {weekdays.map((day) => (
                                <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => handleWeekendToggle(day.value)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        data.weekends.includes(day.value)
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                        {errors.weekends && (
                            <p className="mt-2 text-sm text-red-600">{errors.weekends}</p>
                        )}
                    </div>

                    {/* Role Labels */}
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Role Labels</h3>
                        <p className="text-sm text-gray-500 mb-4">Customise how roles are displayed throughout the system (e.g. rename "Manager" to "Mentor").</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { key: 'role_label_employee', default: 'Employee' },
                                { key: 'role_label_manager', default: 'Manager' },
                                { key: 'role_label_admin', default: 'Admin' },
                                { key: 'role_label_super_admin', default: 'Super Admin' },
                            ].map(({ key, default: def }) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {def} Label
                                    </label>
                                    <input
                                        type="text"
                                        value={data[key]}
                                        onChange={(e) => setData(key, e.target.value)}
                                        placeholder={def}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                    {errors[key] && <p className="mt-1 text-sm text-red-600">{errors[key]}</p>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Authentication */}
                    {isSuperAdmin && (
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-1 flex items-center gap-2">
                                <Lock className="h-4 w-4 text-gray-500" />
                                Authentication
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Control how users sign in. When password login is disabled, users can only sign in via magic link sent to their email.
                            </p>
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.password_login_enabled}
                                    onChange={(e) => setData('password_login_enabled', e.target.checked)}
                                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <div>
                                    <span className="block text-sm font-medium text-gray-900">Enable password login</span>
                                    <span className="block text-xs text-gray-500">
                                        {data.password_login_enabled
                                            ? 'Users can sign in with a password or a magic link.'
                                            : 'Passwordless mode — users sign in only via magic link. Welcome emails will not include a temporary password.'}
                                    </span>
                                </div>
                            </label>
                            {errors.password_login_enabled && (
                                <p className="mt-1 text-sm text-red-600">{errors.password_login_enabled}</p>
                            )}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="p-6 bg-gray-50 rounded-b-lg flex items-center justify-between">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Settings'}
                        </button>
                        {isSuperAdmin && (
                            <a
                                href="/settings/export-db"
                                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <Database className="h-4 w-4" />
                                Export Database
                            </a>
                        )}
                    </div>
                </div>
            </form>

            {isSuperAdmin && (
                <div className="max-w-3xl mt-8">
                    <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                        <Key className="h-5 w-5 text-gray-500" />
                                        API Tokens
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Generate tokens for the external API. Tokens are shown once — copy and store them securely.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowApiDocs(true)}
                                    className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                                >
                                    <BookOpen className="h-4 w-4" />
                                    API Docs
                                </button>
                            </div>

                            {newToken && (
                                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                                    <p className="text-sm font-medium text-green-800 mb-2">New token generated — copy it now:</p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-xs bg-white border border-green-300 rounded px-3 py-2 font-mono break-all">
                                            {newToken}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={handleCopyToken}
                                            className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 text-sm border border-green-300 rounded text-green-700 hover:bg-green-100"
                                        >
                                            {copiedToken ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            {copiedToken ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleGenerateToken} className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    value={newTokenName}
                                    onChange={(e) => setNewTokenName(e.target.value)}
                                    placeholder="Token name (e.g. My Integration)"
                                    required
                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <Plus className="h-4 w-4" />
                                    Generate
                                </button>
                            </form>

                            {apiTokens.length === 0 ? (
                                <p className="text-sm text-gray-500">No API tokens yet.</p>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead>
                                        <tr>
                                            <th className="text-left py-2 font-medium text-gray-500">Name</th>
                                            <th className="text-left py-2 font-medium text-gray-500">Created</th>
                                            <th className="text-left py-2 font-medium text-gray-500">Last Used</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {apiTokens.map((token) => (
                                            <tr key={token.id}>
                                                <td className="py-2 font-medium text-gray-900">{token.name}</td>
                                                <td className="py-2 text-gray-500">{new Date(token.created_at).toLocaleDateString()}</td>
                                                <td className="py-2 text-gray-500">{token.last_used_at ? new Date(token.last_used_at).toLocaleDateString() : 'Never'}</td>
                                                <td className="py-2 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRevokeToken(token.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Revoke"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {/* Endpoint summary table */}
                            <div className="mt-6 rounded-lg border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Available Endpoints</span>
                                    <button
                                        type="button"
                                        onClick={() => setShowApiDocs(true)}
                                        className="text-xs text-indigo-600 hover:underline"
                                    >
                                        View full docs →
                                    </button>
                                </div>

                                {/* Auth legend */}
                                <div className="flex gap-4 px-4 py-2 bg-white border-b border-gray-100 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><Lock className="h-3 w-3 text-amber-500" /> Bearer token only</span>
                                    <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-indigo-500" /> Bearer token or API Key</span>
                                </div>

                                <table className="min-w-full text-xs font-mono">
                                    <tbody className="divide-y divide-gray-100">
                                        {[
                                            { method:'POST', path:'/api/v1/auth/magic-link',            auth:'public',  label:'Request magic-link email' },
                                            { method:'GET',  path:'/api/v1/auth/magic-link/{token}',    auth:'public',  label:'Authenticate → get Bearer token' },
                                            { method:'POST', path:'/api/v1/auth/logout',                auth:'bearer',  label:'Revoke current Bearer token' },
                                            { method:'GET',  path:'/api/v1/leaves/balance?email=',      auth:'flex',    label:'Leave balance (entitled, used, available)' },
                                            { method:'GET',  path:'/api/v1/leaves/summary?email=',      auth:'flex',    label:'Leave count by status & type' },
                                            { method:'GET',  path:'/api/v1/leaves/pending?email=',      auth:'flex',    label:'Pending leave requests for user' },
                                            { method:'GET',  path:'/api/v1/leaves/history?email=',      auth:'flex',    label:'Leave history for user' },
                                            { method:'GET',  path:'/api/v1/manager/pending-approvals',        auth:'bearer', label:'Team pending approvals (manager+, from token)' },
                                            { method:'POST', path:'/api/v1/reports/generate',           auth:'flex',    label:'Generate & email CSV report (admin+)' },
                                            { method:'GET',  path:'/api/v1/users/{email}',              auth:'bearer',  label:'Get user profile (super_admin)' },
                                            { method:'GET',  path:'/api/v1/users/{email}/balances',     auth:'bearer',  label:'Get user leave balances (super_admin)' },
                                            { method:'POST', path:'/api/v1/users/{email}/leaves',       auth:'bearer',  label:'Submit leave on behalf of user (super_admin)' },
                                        ].map(({ method, path, auth, label }) => (
                                            <tr key={path + method} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 w-12">
                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-white text-[10px] font-bold ${
                                                        method === 'GET'  ? 'bg-emerald-500' :
                                                        method === 'POST' ? 'bg-blue-500' : 'bg-orange-500'
                                                    }`}>{method}</span>
                                                </td>
                                                <td className="px-2 py-2 text-gray-800 whitespace-nowrap">{path}</td>
                                                <td className="px-2 py-2 text-gray-400 hidden sm:table-cell">{label}</td>
                                                <td className="px-4 py-2 text-right">
                                                    {auth === 'public' && <span className="text-gray-400 text-[10px]">public</span>}
                                                    {auth === 'bearer' && <Lock className="h-3 w-3 text-amber-500 inline" />}
                                                    {auth === 'flex'   && <Zap  className="h-3 w-3 text-indigo-500 inline" />}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── API Documentation Modal ─────────────────────────────────── */}
            {showApiDocs && <ApiDocsModal onClose={() => setShowApiDocs(false)} copiedCurl={copiedCurl} setCopiedCurl={setCopiedCurl} expandedEndpoint={expandedEndpoint} setExpandedEndpoint={setExpandedEndpoint} />}
        </AuthenticatedLayout>
    );
}

/* ─── API Docs Modal ─────────────────────────────────────────────────────── */

const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

const ENDPOINTS = [
    {
        group: 'Authentication',
        color: 'gray',
        items: [
            {
                method: 'POST', path: '/api/v1/auth/magic-link', auth: 'public',
                title: 'Request magic link',
                desc: 'Sends a one-time login link to the email. Email must exist in the system.',
                params: [{ name: 'email', type: 'string', req: true, desc: 'User email address' }],
                curl: `curl -X POST ${BASE}/api/v1/auth/magic-link \\\n  -H "Content-Type: application/json" \\\n  -H "Accept: application/json" \\\n  -d '{"email": "user@company.com"}'`,
                response: `{"message": "Magic link sent to your email address. It expires in 15 minutes."}`,
            },
            {
                method: 'GET', path: '/api/v1/auth/magic-link/{token}', auth: 'public',
                title: 'Authenticate (get Bearer token)',
                desc: 'Exchange the token from the email link for a 7-day Sanctum Bearer token.',
                params: [{ name: 'token', type: 'path', req: true, desc: '64-char token from the email link' }],
                curl: `curl -X GET "${BASE}/api/v1/auth/magic-link/PASTE_TOKEN_HERE" \\\n  -H "Accept: application/json"`,
                response: `{\n  "message": "Authentication successful.",\n  "token": "1|xxxxxxxxxxxxxxxx",\n  "token_type": "Bearer",\n  "expires_in": 604800,\n  "user": {"id": 1, "name": "John Doe", "email": "user@company.com", "role": "admin"}\n}`,
            },
            {
                method: 'POST', path: '/api/v1/auth/logout', auth: 'bearer',
                title: 'Logout',
                desc: 'Revokes the current Bearer token.',
                params: [],
                curl: `curl -X POST ${BASE}/api/v1/auth/logout \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Accept: application/json"`,
                response: `{"message": "Logged out successfully."}`,
            },
        ],
    },
    {
        group: 'Leave',
        color: 'emerald',
        items: [
            {
                method: 'GET', path: '/api/v1/leaves/balance', auth: 'flex',
                title: 'Leave balance',
                desc: 'Returns leave entitlement, used days, pending days and available balance for each leave type. Defaults to the current financial year.',
                params: [
                    { name: 'email', type: 'query', req: true,  desc: 'User email address' },
                    { name: 'year',  type: 'query', req: false, desc: 'Financial year, e.g. 2025-2026 (defaults to current)' },
                ],
                curl: `# Bearer token\ncurl "${BASE}/api/v1/leaves/balance?email=john@company.com" \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Accept: application/json"\n\n# API Key\ncurl "${BASE}/api/v1/leaves/balance?email=john@company.com" \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -H "Accept: application/json"`,
                response: `{\n  "email": "john@company.com",\n  "financial_year": "2025-2026",\n  "balances": [\n    {\n      "leave_type": "Annual Leave",\n      "leave_type_code": "AL",\n      "entitled_days": 14,\n      "carried_over": 2,\n      "adjustment": 0,\n      "total_entitled": 16,\n      "used_days": 6,\n      "pending_days": 1,\n      "available_balance": 9\n    }\n  ]\n}`,
            },
            {
                method: 'GET', path: '/api/v1/leaves/summary', auth: 'flex',
                title: 'Leave summary',
                desc: 'Total leave count broken down by status and leave type for any user.',
                params: [
                    { name: 'email', type: 'query', req: true,  desc: 'User email' },
                    { name: 'year',  type: 'query', req: false, desc: 'Financial year, e.g. 2025-2026 (omit for all)' },
                ],
                curl: `# Bearer token\ncurl "${BASE}/api/v1/leaves/summary?email=john@company.com" \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Accept: application/json"\n\n# API Key\ncurl "${BASE}/api/v1/leaves/summary?email=john@company.com" \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -H "Accept: application/json"`,
                response: `{\n  "email": "john@company.com",\n  "financial_year": "all",\n  "summary": {\n    "total": 8,\n    "by_status": {"pending":1,"approved":6,"rejected":0,"cancelled":1},\n    "total_days_approved": 12.0,\n    "by_leave_type": [\n      {"leave_type":"Annual Leave","count":4,"total_days":8.0}\n    ]\n  }\n}`,
            },
            {
                method: 'GET', path: '/api/v1/leaves/pending', auth: 'flex',
                title: 'Pending leave requests',
                desc: 'All leave requests awaiting approval for a user.',
                params: [{ name: 'email', type: 'query', req: true, desc: 'User email' }],
                curl: `# Bearer token\ncurl "${BASE}/api/v1/leaves/pending?email=john@company.com" \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Accept: application/json"\n\n# API Key\ncurl "${BASE}/api/v1/leaves/pending?email=john@company.com" \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -H "Accept: application/json"`,
                response: `{\n  "email": "john@company.com",\n  "pending_count": 1,\n  "pending_requests": [\n    {"id":42,"leave_type":"Annual Leave","start_date":"2026-04-01","end_date":"2026-04-03","total_days":3.0,"reason":"Holiday","submitted_at":"2026-03-20T10:00:00+08:00"}\n  ]\n}`,
            },
            {
                method: 'GET', path: '/api/v1/leaves/history', auth: 'flex',
                title: 'Leave history',
                desc: 'Past leave requests (approved, rejected, cancelled) for a user.',
                params: [
                    { name: 'email', type: 'query', req: true,  desc: 'User email' },
                    { name: 'year',  type: 'query', req: false, desc: 'Financial year filter' },
                ],
                curl: `# Bearer token\ncurl "${BASE}/api/v1/leaves/history?email=john@company.com&year=2025-2026" \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Accept: application/json"\n\n# API Key\ncurl "${BASE}/api/v1/leaves/history?email=john@company.com&year=2025-2026" \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -H "Accept: application/json"`,
                response: `{\n  "email": "john@company.com",\n  "financial_year": "2025-2026",\n  "total": 6,\n  "history": [\n    {"id":38,"leave_type":"Annual Leave","start_date":"2026-01-15","end_date":"2026-01-17","total_days":3.0,"status":"approved","approved_by":"Jane Manager","approved_at":"2026-01-10"}\n  ]\n}`,
            },
        ],
    },
    {
        group: 'Manager',
        color: 'violet',
        items: [
            {
                method: 'GET', path: '/api/v1/manager/pending-approvals', auth: 'bearer',
                title: 'Team pending approvals',
                desc: 'Returns pending leave requests that the authenticated manager needs to approve. The manager\'s identity is taken from the Bearer token — no email param needed. super_admin/admin see all system requests; manager role sees subordinates + managed department only.',
                params: [],
                curl: `curl "${BASE}/api/v1/manager/pending-approvals" \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Accept: application/json"`,
                response: `{\n  "manager_email": "jane@company.com",\n  "manager_role": "manager",\n  "pending_count": 2,\n  "pending_approvals": [\n    {"id":42,"employee_name":"John Doe","employee_email":"john@company.com","department":"Engineering","leave_type":"Annual Leave","start_date":"2026-04-01","end_date":"2026-04-03","total_days":3.0}\n  ]\n}`,
            },
        ],
    },
    {
        group: 'Reports',
        color: 'orange',
        items: [
            {
                method: 'POST', path: '/api/v1/reports/generate', auth: 'flex',
                title: 'Generate & email CSV report',
                desc: 'Generates a CSV report and emails it to the requesting user. The email must belong to an admin or super_admin.',
                params: [
                    { name: 'email',         type: 'body', req: true,  desc: 'Requesting user email (admin/super_admin)' },
                    { name: 'report_type',   type: 'body', req: true,  desc: 'leave_summary | department_summary | employee_leave' },
                    { name: 'year',          type: 'body', req: false, desc: 'Financial year (defaults to current)' },
                    { name: 'department_id', type: 'body', req: false, desc: 'Filter by department ID' },
                ],
                curl: `# Bearer token\ncurl -X POST ${BASE}/api/v1/reports/generate \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -H "Accept: application/json" \\\n  -d '{"email":"admin@company.com","report_type":"leave_summary","year":"2025-2026"}'\n\n# API Key\ncurl -X POST ${BASE}/api/v1/reports/generate \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -H "Accept: application/json" \\\n  -d '{"email":"admin@company.com","report_type":"leave_summary","year":"2025-2026"}'`,
                response: `{\n  "message": "Report generated and sent to admin@company.com.",\n  "report_type": "leave_summary",\n  "financial_year": "2025-2026",\n  "filename": "leave_summary_2025-2026_20260324_140000.csv"\n}`,
            },
        ],
    },
    {
        group: 'Users (super_admin only)',
        color: 'red',
        items: [
            {
                method: 'GET', path: '/api/v1/users/{email}', auth: 'bearer',
                title: 'Get user profile',
                desc: 'Fetch profile for any user by email. Requires super_admin Bearer token.',
                params: [{ name: 'email', type: 'path', req: true, desc: 'Target user email' }],
                curl: `curl "${BASE}/api/v1/users/john@company.com" \\\n  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \\\n  -H "Accept: application/json"`,
                response: `{"id":1,"name":"John Doe","email":"john@company.com","role":"employee","is_active":true,"employee":{...}}`,
            },
            {
                method: 'GET', path: '/api/v1/users/{email}/balances', auth: 'bearer',
                title: 'Get user leave balances',
                desc: 'Fetch leave balances for the current financial year. Requires super_admin Bearer token.',
                params: [{ name: 'email', type: 'path', req: true, desc: 'Target user email' }],
                curl: `curl "${BASE}/api/v1/users/john@company.com/balances" \\\n  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \\\n  -H "Accept: application/json"`,
                response: `{"email":"john@company.com","financial_year":"2025-2026","balances":[{"leave_type":"Annual Leave","entitled_days":14,"used_days":6,"available_balance":8}]}`,
            },
            {
                method: 'POST', path: '/api/v1/users/{email}/leaves', auth: 'bearer',
                title: 'Submit leave on behalf of user',
                desc: 'Creates a leave request for a user. Requires super_admin Bearer token.',
                params: [
                    { name: 'leave_type_id', type: 'body', req: true,  desc: 'Leave type ID' },
                    { name: 'start_date',    type: 'body', req: true,  desc: 'YYYY-MM-DD' },
                    { name: 'end_date',      type: 'body', req: true,  desc: 'YYYY-MM-DD' },
                    { name: 'start_half',    type: 'body', req: true,  desc: 'full | first_half | second_half' },
                    { name: 'end_half',      type: 'body', req: true,  desc: 'full | first_half | second_half' },
                    { name: 'reason',        type: 'body', req: false, desc: 'Reason for leave' },
                ],
                curl: `curl -X POST "${BASE}/api/v1/users/john@company.com/leaves" \\\n  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -H "Accept: application/json" \\\n  -d '{"leave_type_id":1,"start_date":"2026-04-07","end_date":"2026-04-09","start_half":"full","end_half":"full","reason":"Annual leave"}'`,
                response: `{"message":"Leave request submitted successfully.","leave_request":{"id":55,"leave_type":"Annual Leave","start_date":"2026-04-07","end_date":"2026-04-09","total_days":3,"status":"pending"}}`,
            },
        ],
    },
];

const methodColor = {
    GET:  'bg-emerald-500',
    POST: 'bg-blue-500',
    PUT:  'bg-orange-500',
    DELETE: 'bg-red-500',
};

const authBadge = {
    public: { label: 'Public',      cls: 'bg-gray-100 text-gray-600' },
    bearer: { label: 'Bearer only', cls: 'bg-amber-100 text-amber-700' },
    flex:   { label: 'Bearer or API Key', cls: 'bg-indigo-100 text-indigo-700' },
};

function CurlBlock({ curl, id, copiedCurl, setCopiedCurl }) {
    const copy = () => {
        navigator.clipboard.writeText(curl);
        setCopiedCurl(id);
        setTimeout(() => setCopiedCurl(null), 2000);
    };
    return (
        <div className="relative">
            <pre className="bg-gray-900 text-gray-100 rounded-md p-4 text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">{curl}</pre>
            <button
                type="button"
                onClick={copy}
                className="absolute top-2 right-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
                title="Copy"
            >
                {copiedCurl === id ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
        </div>
    );
}

function ApiDocsModal({ onClose, copiedCurl, setCopiedCurl, expandedEndpoint, setExpandedEndpoint }) {
    const toggle = (key) => setExpandedEndpoint(prev => prev === key ? null : key);

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8">
                {/* Modal header */}
                <div className="sticky top-0 bg-white rounded-t-xl border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-indigo-600" />
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">API Documentation</h2>
                            <p className="text-xs text-gray-500">Base URL: <code className="font-mono bg-gray-100 px-1 rounded">{BASE}/api/v1</code></p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Auth overview */}
                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Authentication
                        </div>
                        <div className="p-4 grid sm:grid-cols-2 gap-3 text-sm">
                            <div className="rounded-md bg-indigo-50 border border-indigo-100 p-3">
                                <p className="font-medium text-indigo-800 mb-1 flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> API Key</p>
                                <code className="text-xs text-indigo-700 block">X-API-Key: YOUR_KEY</code>
                                <code className="text-xs text-indigo-700 block mt-0.5">?api_key=YOUR_KEY</code>
                                <p className="text-xs text-indigo-600 mt-1">Generate below. Works on all <span className="font-semibold">flex</span> endpoints.</p>
                            </div>
                            <div className="rounded-md bg-amber-50 border border-amber-100 p-3">
                                <p className="font-medium text-amber-800 mb-1 flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> Bearer Token</p>
                                <code className="text-xs text-amber-700 block">Authorization: Bearer TOKEN</code>
                                <p className="text-xs text-amber-600 mt-1">Obtained via magic-link login. Required for super_admin endpoints.</p>
                            </div>
                        </div>
                    </div>

                    {/* API Key permissions table */}
                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            API Key Permissions
                        </div>
                        <table className="min-w-full text-xs">
                            <thead className="bg-white border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-2 font-medium text-gray-500">Permission</th>
                                    <th className="text-left px-4 py-2 font-medium text-gray-500">Grants access to</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {[
                                    ['leaves.read',       '/leaves/summary, /leaves/pending, /leaves/history'],
                                    ['manager.read',      '/manager/pending-approvals'],
                                    ['reports.generate',  '/reports/generate'],
                                    ['(empty)',           'All of the above'],
                                ].map(([perm, desc]) => (
                                    <tr key={perm}>
                                        <td className="px-4 py-2 font-mono text-indigo-700">{perm}</td>
                                        <td className="px-4 py-2 text-gray-600">{desc}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Endpoint groups */}
                    {ENDPOINTS.map((group) => (
                        <div key={group.group} className="rounded-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                {group.group}
                            </div>
                            <div className="divide-y divide-gray-100">
                                {group.items.map((ep, i) => {
                                    const key = `${group.group}-${i}`;
                                    const open = expandedEndpoint === key;
                                    return (
                                        <div key={key}>
                                            <button
                                                type="button"
                                                onClick={() => toggle(key)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                                            >
                                                <span className={`flex-shrink-0 inline-block px-1.5 py-0.5 rounded text-white text-[10px] font-bold w-10 text-center ${methodColor[ep.method] ?? 'bg-gray-400'}`}>
                                                    {ep.method}
                                                </span>
                                                <code className="flex-1 text-xs text-gray-800 font-mono">{ep.path}</code>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${authBadge[ep.auth].cls}`}>
                                                    {authBadge[ep.auth].label}
                                                </span>
                                                {open
                                                    ? <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                    : <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                }
                                            </button>

                                            {open && (
                                                <div className="px-4 pb-4 space-y-4 bg-white">
                                                    <p className="text-sm text-gray-600">{ep.desc}</p>

                                                    {ep.params.length > 0 && (
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Parameters</p>
                                                            <table className="min-w-full text-xs border border-gray-100 rounded-md overflow-hidden">
                                                                <thead className="bg-gray-50">
                                                                    <tr>
                                                                        <th className="text-left px-3 py-1.5 font-medium text-gray-500">Name</th>
                                                                        <th className="text-left px-3 py-1.5 font-medium text-gray-500">In</th>
                                                                        <th className="text-left px-3 py-1.5 font-medium text-gray-500">Required</th>
                                                                        <th className="text-left px-3 py-1.5 font-medium text-gray-500">Description</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {ep.params.map(p => (
                                                                        <tr key={p.name}>
                                                                            <td className="px-3 py-1.5 font-mono text-indigo-700">{p.name}</td>
                                                                            <td className="px-3 py-1.5 text-gray-500">{p.type}</td>
                                                                            <td className="px-3 py-1.5">{p.req ? <span className="text-red-500">yes</span> : <span className="text-gray-400">no</span>}</td>
                                                                            <td className="px-3 py-1.5 text-gray-600">{p.desc}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">curl example</p>
                                                        <CurlBlock curl={ep.curl} id={key + '-curl'} copiedCurl={copiedCurl} setCopiedCurl={setCopiedCurl} />
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Example response</p>
                                                        <pre className="bg-gray-50 border border-gray-200 text-gray-700 rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">{ep.response}</pre>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
