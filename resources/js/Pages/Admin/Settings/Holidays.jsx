import { Head, useForm, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Settings, Calendar, Building2, Mail, MailOpen, Plus, Edit, Trash2, X, Clock } from 'lucide-react';
import { useState } from 'react';
import { formatDate } from '@/lib/utils';

export default function Holidays({ holidays }) {
    const { auth } = usePage().props;
    const isSuperAdmin = auth.user?.role === 'super_admin';

    const [showModal, setShowModal] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        date: '',
        is_recurring: false,
        description: '',
    });

    const openCreateModal = () => {
        reset();
        setEditingHoliday(null);
        setShowModal(true);
    };

    const openEditModal = (holiday) => {
        setEditingHoliday(holiday);
        setData({
            name: holiday.name,
            date: holiday.date,
            is_recurring: holiday.is_recurring,
            description: holiday.description || '',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingHoliday(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingHoliday) {
            put(`/settings/holidays/${editingHoliday.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/settings/holidays', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (holiday) => {
        if (confirm(`Are you sure you want to delete "${holiday.name}"?`)) {
            router.delete(`/settings/holidays/${holiday.id}`);
        }
    };

    return (
        <AuthenticatedLayout title="Public Holidays">
            <Head title="Public Holidays" />

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
                        className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
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

            {/* Header with Add Button */}
            <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-gray-500">
                    Manage public holidays that will be excluded from leave calculations.
                </p>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4" />
                    Add Holiday
                </button>
            </div>

            {/* Holidays Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Recurring
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {holidays.data.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                    No public holidays found. Add your first holiday.
                                </td>
                            </tr>
                        ) : (
                            holidays.data.map((holiday) => (
                                <tr key={holiday.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {holiday.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(holiday.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            holiday.is_recurring
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {holiday.is_recurring ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                        {holiday.description || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => openEditModal(holiday)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(holiday)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {holidays.last_page > 1 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200">
                        <div className="text-sm text-gray-700">
                            Showing {holidays.from} to {holidays.to} of {holidays.total} results
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">
                                {editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Holiday Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    id="date"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    Description (Optional)
                                </label>
                                <textarea
                                    id="description"
                                    rows={2}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_recurring"
                                    checked={data.is_recurring}
                                    onChange={(e) => setData('is_recurring', e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-700">
                                    Recurring annually
                                </label>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : editingHoliday ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
