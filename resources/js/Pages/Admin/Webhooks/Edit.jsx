import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, Save } from 'lucide-react';

export default function WebhookEdit({ webhook, availableEvents }) {
    const { data, setData, put, processing, errors } = useForm({
        name: webhook.name || '',
        url: webhook.url || '',
        secret: webhook.secret || '',
        events: webhook.events || [],
        is_active: webhook.is_active ?? true,
    });

    const handleEventToggle = (event) => {
        if (data.events.includes(event)) {
            setData('events', data.events.filter(e => e !== event));
        } else {
            setData('events', [...data.events, event]);
        }
    };

    const handleSelectAll = () => {
        if (data.events.length === Object.keys(availableEvents).length) {
            setData('events', []);
        } else {
            setData('events', Object.keys(availableEvents));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/webhooks/${webhook.id}`);
    };

    return (
        <AuthenticatedLayout title={`Edit Webhook: ${webhook.name}`}>
            <Head title={`Edit ${webhook.name}`} />

            <div className="mb-6">
                <Link
                    href="/webhooks"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Webhooks
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl">
                <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
                    {/* Basic Information */}
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Webhook Configuration</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="e.g., Slack Notifications"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div>
                                <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                                    Endpoint URL
                                </label>
                                <input
                                    type="url"
                                    id="url"
                                    value={data.url}
                                    onChange={(e) => setData('url', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="https://example.com/webhook"
                                />
                                {errors.url && <p className="mt-1 text-sm text-red-600">{errors.url}</p>}
                            </div>

                            <div>
                                <label htmlFor="secret" className="block text-sm font-medium text-gray-700">
                                    Secret (Optional)
                                </label>
                                <input
                                    type="text"
                                    id="secret"
                                    value={data.secret}
                                    onChange={(e) => setData('secret', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="Shared secret for signature verification"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Used to sign webhook payloads for verification. Leave empty to keep existing secret.
                                </p>
                                {errors.secret && <p className="mt-1 text-sm text-red-600">{errors.secret}</p>}
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                                    Active
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Events */}
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Events</h3>
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="text-sm text-indigo-600 hover:text-indigo-800"
                            >
                                {data.events.length === Object.keys(availableEvents).length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Select the events that should trigger this webhook.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(availableEvents).map(([event, label]) => (
                                <div
                                    key={event}
                                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                        data.events.includes(event)
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => handleEventToggle(event)}
                                >
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={data.events.includes(event)}
                                            onChange={() => {}}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-gray-900">{label}</div>
                                            <div className="text-xs text-gray-500">{event}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {errors.events && <p className="mt-2 text-sm text-red-600">{errors.events}</p>}
                    </div>

                    {/* Submit */}
                    <div className="p-6 bg-gray-50 rounded-b-lg flex justify-end gap-3">
                        <Link
                            href="/webhooks"
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Saving...' : 'Update Webhook'}
                        </button>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
