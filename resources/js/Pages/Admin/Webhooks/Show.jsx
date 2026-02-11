import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, Edit, Play, Globe, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function WebhookShow({ webhook }) {
    const handleTest = () => {
        if (confirm('Send a test webhook to this endpoint?')) {
            router.post(`/webhooks/${webhook.id}/test`);
        }
    };

    const getStatusIcon = (status) => {
        if (status >= 200 && status < 300) {
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        } else if (status >= 400) {
            return <XCircle className="h-4 w-4 text-red-500" />;
        }
        return <Clock className="h-4 w-4 text-yellow-500" />;
    };

    const getStatusColor = (status) => {
        if (status >= 200 && status < 300) {
            return 'bg-green-100 text-green-800';
        } else if (status >= 400) {
            return 'bg-red-100 text-red-800';
        }
        return 'bg-yellow-100 text-yellow-800';
    };

    return (
        <AuthenticatedLayout title={`Webhook: ${webhook.name}`}>
            <Head title={webhook.name} />

            <div className="mb-6 flex justify-between items-center">
                <Link
                    href="/webhooks"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Webhooks
                </Link>
                <div className="flex gap-2">
                    <button
                        onClick={handleTest}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <Play className="h-4 w-4" />
                        Test Webhook
                    </button>
                    <Link
                        href={`/webhooks/${webhook.id}/edit`}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Edit className="h-4 w-4" />
                        Edit
                    </Link>
                </div>
            </div>

            <div className="space-y-6">
                {/* Webhook Details */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Globe className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">{webhook.name}</h3>
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                webhook.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                            }`}>
                                {webhook.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                    <div className="p-6">
                        <dl className="grid grid-cols-1 gap-4">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Endpoint URL</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded break-all">
                                    {webhook.url}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Secret</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {webhook.secret ? '••••••••••••' : 'Not set'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Events</dt>
                                <dd className="mt-1">
                                    <div className="flex flex-wrap gap-2">
                                        {webhook.events?.map((event) => (
                                            <span
                                                key={event}
                                                className="inline-flex px-2 py-1 text-xs font-medium rounded bg-indigo-100 text-indigo-700"
                                            >
                                                {event}
                                            </span>
                                        ))}
                                    </div>
                                </dd>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {formatDate(webhook.created_at)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {formatDate(webhook.updated_at)}
                                    </dd>
                                </div>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Recent Logs */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Recent Delivery Logs</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Event
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Response
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Timestamp
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {!webhook.logs || webhook.logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">
                                            No delivery logs yet. Send a test webhook or wait for events to trigger.
                                        </td>
                                    </tr>
                                ) : (
                                    webhook.logs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(log.response_status)}
                                                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(log.response_status)}`}>
                                                        {log.response_status || 'Pending'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {log.event || 'test'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                {log.response_body || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(log.created_at)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
