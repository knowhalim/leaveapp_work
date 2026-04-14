import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Mail, Send, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MassEmail({ departments, employeeTypes, roles, positions }) {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sendStatus, setSendStatus] = useState(null);
    const [isSending, setIsSending] = useState(false);

    const { data, setData, processing, errors } = useForm({
        subject: '',
        message: '',
        recipient_type: 'all',
        department_id: '',
        employee_type_id: '',
        role: '',
        position: '',
    });

    const fetchPreview = async () => {
        setLoading(true);
        try {
            const response = await window.axios.post('/mass-email/preview', {
                recipient_type: data.recipient_type,
                department_id: data.department_id || null,
                employee_type_id: data.employee_type_id || null,
                role: data.role || null,
                position: data.position || null,
            });
            setPreview(response.data);
        } catch (error) {
            console.error('Preview failed:', error);
            setPreview({ count: 0, recipients: [] });
        }
        setLoading(false);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPreview();
        }, 300);
        return () => clearTimeout(timer);
    }, [data.recipient_type, data.department_id, data.employee_type_id, data.role, data.position]);

    const handleSend = async (e) => {
        e.preventDefault();

        if (!data.subject.trim()) {
            setSendStatus({ type: 'error', message: 'Please enter a subject' });
            return;
        }
        if (!data.message.trim()) {
            setSendStatus({ type: 'error', message: 'Please enter a message' });
            return;
        }
        if (!preview || preview.count === 0) {
            setSendStatus({ type: 'error', message: 'No recipients selected' });
            return;
        }

        if (!confirm(`Are you sure you want to send this email to ${preview.count} recipient(s)?`)) {
            return;
        }

        setIsSending(true);
        setSendStatus(null);

        try {
            const response = await window.axios.post('/mass-email/send', {
                subject: data.subject,
                message: data.message,
                recipient_type: data.recipient_type,
                department_id: data.department_id || null,
                employee_type_id: data.employee_type_id || null,
                role: data.role || null,
                position: data.position || null,
            });

            setSendStatus({ type: 'success', message: response.data.message || 'Emails sent successfully!' });
            // Reset form
            setData({
                subject: '',
                message: '',
                recipient_type: 'all',
                department_id: '',
                employee_type_id: '',
                role: '',
                position: '',
            });
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to send emails';
            setSendStatus({ type: 'error', message });
        }

        setIsSending(false);
    };

    const getRecipientLabel = () => {
        switch (data.recipient_type) {
            case 'all':
                return 'All Employees';
            case 'department':
                const dept = departments.find(d => d.id == data.department_id);
                return dept ? `Department: ${dept.name}` : 'Select a department';
            case 'employee_type':
                const type = employeeTypes.find(t => t.id == data.employee_type_id);
                return type ? `Employee Type: ${type.name}` : 'Select an employee type';
            case 'role':
                return data.role ? `Role: ${data.role.replace('_', ' ')}` : 'Select a role';
            case 'position':
                return data.position ? `Position: ${data.position}` : 'Select a position';
            default:
                return 'Select recipients';
        }
    };

    return (
        <AuthenticatedLayout title="Mass Email">
            <Head title="Mass Email" />

            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Send Mass Email</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Send announcements or notifications to multiple employees at once.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Compose Form */}
                    <div className="lg:col-span-2 bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-indigo-600" />
                                <h3 className="text-lg font-medium text-gray-900">Compose Email</h3>
                            </div>
                        </div>
                        <form onSubmit={handleSend} className="p-6 space-y-6">
                            {/* Recipients Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Recipients
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => setData({ ...data, recipient_type: 'all', department_id: '', employee_type_id: '', role: '', position: '' })}
                                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                            data.recipient_type === 'all'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        All Employees
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData({ ...data, recipient_type: 'department', employee_type_id: '', role: '', position: '' })}
                                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                            data.recipient_type === 'department'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        By Department
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData({ ...data, recipient_type: 'employee_type', department_id: '', role: '', position: '' })}
                                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                            data.recipient_type === 'employee_type'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        By Type
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData({ ...data, recipient_type: 'role', department_id: '', employee_type_id: '', position: '' })}
                                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                            data.recipient_type === 'role'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        By Role
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData({ ...data, recipient_type: 'position', department_id: '', employee_type_id: '', role: '' })}
                                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                            data.recipient_type === 'position'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        By Position
                                    </button>
                                </div>

                                {data.recipient_type === 'department' && (
                                    <select
                                        value={data.department_id}
                                        onChange={(e) => setData('department_id', e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {data.recipient_type === 'employee_type' && (
                                    <select
                                        value={data.employee_type_id}
                                        onChange={(e) => setData('employee_type_id', e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    >
                                        <option value="">Select Employee Type</option>
                                        {employeeTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.name}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {data.recipient_type === 'role' && (
                                    <select
                                        value={data.role}
                                        onChange={(e) => setData('role', e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    >
                                        <option value="">Select Role</option>
                                        {roles.map((role) => (
                                            <option key={role} value={role}>
                                                {role.replace('_', ' ')}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {data.recipient_type === 'position' && (
                                    <select
                                        value={data.position}
                                        onChange={(e) => setData('position', e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    >
                                        <option value="">Select Position</option>
                                        {(positions || []).map((pos) => (
                                            <option key={pos} value={pos}>
                                                {pos}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Subject */}
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                                    Subject <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="subject"
                                    value={data.subject}
                                    onChange={(e) => setData('subject', e.target.value)}
                                    placeholder="Enter email subject"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    required
                                />
                                {errors.subject && (
                                    <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                                )}
                            </div>

                            {/* Message */}
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                                    Message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="message"
                                    value={data.message}
                                    onChange={(e) => setData('message', e.target.value)}
                                    placeholder="Enter your message here..."
                                    rows={8}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Plain text only. Line breaks will be preserved.
                                </p>
                                {errors.message && (
                                    <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                                )}
                            </div>

                            {/* Status Message */}
                            {sendStatus && (
                                <div
                                    className={`flex items-center gap-2 p-3 rounded-md ${
                                        sendStatus.type === 'success'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                    {sendStatus.type === 'success' ? (
                                        <CheckCircle className="h-5 w-5" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5" />
                                    )}
                                    <span className="text-sm">{sendStatus.message}</span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSending || !preview || preview.count === 0}
                                    className="inline-flex items-center gap-2 px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="h-4 w-4" />
                                    {isSending ? 'Sending...' : `Send to ${preview?.count || 0} Recipient(s)`}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Recipients Preview */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-indigo-600" />
                                <h3 className="text-lg font-medium text-gray-900">Recipients</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                                    <p className="mt-2 text-sm text-gray-500">Loading...</p>
                                </div>
                            ) : preview ? (
                                <>
                                    <div className="mb-4 bg-indigo-50 rounded-lg p-3">
                                        <p className="text-sm text-indigo-800">
                                            <span className="font-bold text-2xl">{preview.count}</span>{' '}
                                            recipient(s)
                                        </p>
                                        <p className="text-xs text-indigo-600 mt-1">
                                            {getRecipientLabel()}
                                        </p>
                                    </div>
                                    {preview.recipients && preview.recipients.length > 0 ? (
                                        <div className="max-h-80 overflow-y-auto">
                                            <ul className="divide-y divide-gray-200">
                                                {preview.recipients.map((recipient) => (
                                                    <li key={recipient.id} className="py-2">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {recipient.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {recipient.email}
                                                        </p>
                                                    </li>
                                                ))}
                                            </ul>
                                            {preview.count > 50 && (
                                                <p className="mt-2 text-xs text-gray-500 text-center">
                                                    Showing first 50 of {preview.count} recipients
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-gray-500">
                                            <Users className="h-8 w-8 mx-auto text-gray-300" />
                                            <p className="mt-2 text-sm">No recipients found</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="h-12 w-12 mx-auto text-gray-300" />
                                    <p className="mt-2">Select recipients to preview</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Warning */}
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <p className="font-medium">Important</p>
                            <ul className="mt-1 list-disc list-inside space-y-1">
                                <li>Emails will be sent from the configured system email address</li>
                                <li>Make sure email settings are properly configured before sending</li>
                                <li>Large recipient lists may take time to process</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
