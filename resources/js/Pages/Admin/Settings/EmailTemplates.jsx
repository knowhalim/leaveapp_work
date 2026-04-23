import { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Settings, Calendar, Building2, Mail, MailOpen, Clock, Save, RotateCcw, Eye } from 'lucide-react';

export default function EmailTemplates({ roles, templates }) {
    const { auth, company_name } = usePage().props;
    const isSuperAdmin = auth.user?.role === 'super_admin';

    const [activeRole, setActiveRole] = useState(roles[0]);
    const [showPreview, setShowPreview] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        templates: roles.reduce((acc, role) => {
            acc[role] = {
                enabled: templates[role]?.enabled ?? false,
                body: templates[role]?.body ?? '',
            };
            return acc;
        }, {}),
    });

    const updateField = (role, field, value) => {
        setData('templates', {
            ...data.templates,
            [role]: { ...data.templates[role], [field]: value },
        });
    };

    const resetToDefault = (role) => {
        if (!confirm(`Reset the ${templates[role]?.label} template to its default content?`)) return;
        updateField(role, 'body', templates[role]?.default ?? '');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/settings/email-templates');
    };

    const current = data.templates[activeRole] ?? { enabled: false, body: '' };
    const currentMeta = templates[activeRole] ?? {};

    // Token substitution for preview
    const previewHtml = (current.body || '')
        .replaceAll('{{role}}', currentMeta.label || activeRole)
        .replaceAll('{{company}}', company_name || 'Your Company')
        .replaceAll('{{name}}', 'Jane Doe')
        .replaceAll('{{email}}', 'jane@company.com');

    return (
        <AuthenticatedLayout title="Email Templates">
            <Head title="Email Templates" />

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    <a href="/settings" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        General
                    </a>
                    <a href="/settings/holidays" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Public Holidays
                    </a>
                    <a href="/settings/employee-types" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Employee Types
                    </a>
                    <a href="/settings/email-templates" className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2">
                        <MailOpen className="h-4 w-4" />
                        Email Templates
                    </a>
                    {isSuperAdmin && (
                        <a href="/settings/email" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                        </a>
                    )}
                    {isSuperAdmin && (
                        <a href="/settings/scheduled-tasks" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Scheduled Tasks
                        </a>
                    )}
                </nav>
            </div>

            <form onSubmit={handleSubmit} className="max-w-5xl">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">"Getting Started" Email Templates</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Customise the onboarding block that appears in the welcome email for each role. When a template is disabled,
                            the default content is used (not read from the database).
                        </p>
                    </div>

                    {/* Role tab bar */}
                    <div className="border-b border-gray-200 bg-gray-50">
                        <div className="flex overflow-x-auto">
                            {roles.map((role) => {
                                const isActive = role === activeRole;
                                const isEnabled = data.templates[role]?.enabled;
                                return (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => setActiveRole(role)}
                                        className={`whitespace-nowrap px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                                            isActive
                                                ? 'border-indigo-500 text-indigo-600 bg-white'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white'
                                        }`}
                                    >
                                        {templates[role]?.label || role}
                                        {isEnabled && (
                                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                                                Custom
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active tab content */}
                    <div className="p-6 space-y-5">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={current.enabled}
                                onChange={(e) => updateField(activeRole, 'enabled', e.target.checked)}
                                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <div>
                                <span className="block text-sm font-medium text-gray-900">
                                    Enable Custom "Getting Started" for {currentMeta.label}
                                </span>
                                <span className="block text-xs text-gray-500">
                                    {current.enabled
                                        ? 'Custom template below will be used in welcome emails for this role.'
                                        : 'The default template is currently active. Check this box to override with your own HTML.'}
                                </span>
                            </div>
                        </label>

                        <div className="rounded-md bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs text-indigo-800">
                            <span className="font-semibold">Available tokens:</span>
                            <code className="ml-2 px-1 bg-white rounded">{'{{role}}'}</code>
                            <code className="ml-1 px-1 bg-white rounded">{'{{company}}'}</code>
                            <code className="ml-1 px-1 bg-white rounded">{'{{name}}'}</code>
                            <code className="ml-1 px-1 bg-white rounded">{'{{email}}'}</code>
                            <span className="ml-2 text-indigo-600">— replaced with the recipient's details at send time.</span>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700">HTML Template</label>
                                <div className="flex items-center gap-3 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setShowPreview((v) => !v)}
                                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        {showPreview ? 'Hide preview' : 'Show preview'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => resetToDefault(activeRole)}
                                        className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-800"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        Reset to default
                                    </button>
                                </div>
                            </div>
                            <textarea
                                rows={18}
                                value={current.body}
                                onChange={(e) => updateField(activeRole, 'body', e.target.value)}
                                disabled={!current.enabled}
                                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs font-mono ${
                                    !current.enabled ? 'bg-gray-50 text-gray-500' : ''
                                }`}
                                spellCheck={false}
                            />
                            {errors[`templates.${activeRole}.body`] && (
                                <p className="mt-1 text-sm text-red-600">{errors[`templates.${activeRole}.body`]}</p>
                            )}
                        </div>

                        {showPreview && (
                            <div>
                                <p className="block text-sm font-medium text-gray-700 mb-1">Preview (sample data)</p>
                                <div
                                    className="border border-gray-200 rounded-md p-4 bg-white"
                                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Templates'}
                        </button>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
