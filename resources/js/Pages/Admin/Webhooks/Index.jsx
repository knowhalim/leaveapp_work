import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, Edit, Trash2, Eye, Play, Globe } from 'lucide-react';

export default function WebhooksIndex({ webhooks, availableEvents }) {
    const handleToggleStatus = (webhook) => {
        router.post(`/webhooks/${webhook.id}/toggle-status`);
    };

    const handleTest = (webhook) => {
        if (confirm('Send a test webhook to this endpoint?')) {
            router.post(`/webhooks/${webhook.id}/test`);
        }
    };

    const handleDelete = (webhook) => {
        if (confirm(`Are you sure you want to delete "${webhook.name}"?`)) {
            router.delete(`/webhooks/${webhook.id}`);
        }
    };

    return (
        <AuthenticatedLayout title="Webhooks">
            <Head title="Webhooks" />

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-gray-500">
                    Configure webhooks to receive real-time notifications when events occur.
                </p>
                <Link
                    href="/webhooks/create"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4" />
                    Add Webhook
                </Link>
            </div>

            {/* Webhooks Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                URL
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Events
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Logs
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {webhooks.data.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center">
                                    <Globe className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No webhooks</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Get started by creating a new webhook.
                                    </p>
                                    <div className="mt-4">
                                        <Link
                                            href="/webhooks/create"
                                            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Webhook
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            webhooks.data.map((webhook) => (
                                <tr key={webhook.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{webhook.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-500 truncate max-w-xs" title={webhook.url}>
                                            {webhook.url}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {webhook.events?.slice(0, 2).map((event) => (
                                                <span
                                                    key={event}
                                                    className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700"
                                                >
                                                    {event}
                                                </span>
                                            ))}
                                            {webhook.events?.length > 2 && (
                                                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                                                    +{webhook.events.length - 2} more
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {webhook.logs_count || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleToggleStatus(webhook)}
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${
                                                webhook.is_active
                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                            }`}
                                        >
                                            {webhook.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleTest(webhook)}
                                                className="text-gray-400 hover:text-green-600"
                                                title="Send test webhook"
                                            >
                                                <Play className="h-4 w-4" />
                                            </button>
                                            <Link
                                                href={`/webhooks/${webhook.id}`}
                                                className="text-gray-400 hover:text-indigo-600"
                                                title="View details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                            <Link
                                                href={`/webhooks/${webhook.id}/edit`}
                                                className="text-gray-400 hover:text-indigo-600"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(webhook)}
                                                className="text-gray-400 hover:text-red-600"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {webhooks.last_page > 1 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200">
                        <div className="text-sm text-gray-700">
                            Showing {webhooks.from} to {webhooks.to} of {webhooks.total} results
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
