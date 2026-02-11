import { Head, useForm, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Settings, Calendar, Building2, Mail, Plus, Edit, Trash2, X, Users } from 'lucide-react';
import { useState } from 'react';

export default function EmployeeTypes({ employeeTypes }) {
    const { auth } = usePage().props;
    const isSuperAdmin = auth.user?.role === 'super_admin';

    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        description: '',
        is_active: true,
    });

    const openCreateModal = () => {
        reset();
        setEditingType(null);
        setShowModal(true);
    };

    const openEditModal = (type) => {
        setEditingType(type);
        setData({
            name: type.name,
            description: type.description || '',
            is_active: type.is_active,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingType(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingType) {
            put(`/settings/employee-types/${editingType.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/settings/employee-types', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (type) => {
        if (type.employees_count > 0) {
            alert('Cannot delete employee type with assigned employees.');
            return;
        }
        if (confirm(`Are you sure you want to delete "${type.name}"?`)) {
            router.delete(`/settings/employee-types/${type.id}`);
        }
    };

    return (
        <AuthenticatedLayout title="Employee Types">
            <Head title="Employee Types" />

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
                        className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
                    >
                        <Building2 className="h-4 w-4" />
                        Employee Types
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
                </nav>
            </div>

            {/* Header with Add Button */}
            <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-gray-500">
                    Manage employee types to categorize employees and set leave allowances.
                </p>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4" />
                    Add Employee Type
                </button>
            </div>

            {/* Employee Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employeeTypes.data.length === 0 ? (
                    <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-500">No employee types found. Add your first employee type.</p>
                    </div>
                ) : (
                    employeeTypes.data.map((type) => (
                        <div key={type.id} className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">{type.name}</h3>
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                                type.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {type.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal(type)}
                                            className="text-gray-400 hover:text-indigo-600"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(type)}
                                            className="text-gray-400 hover:text-red-600"
                                            disabled={type.employees_count > 0}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {type.description && (
                                    <p className="text-sm text-gray-500 mb-4">{type.description}</p>
                                )}

                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs text-gray-500">Employees</div>
                                    <div className="text-xl font-bold text-gray-900">{type.employees_count}</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {employeeTypes.last_page > 1 && (
                <div className="mt-6 bg-white px-4 py-3 rounded-lg shadow">
                    <div className="text-sm text-gray-700">
                        Showing {employeeTypes.from} to {employeeTypes.to} of {employeeTypes.total} results
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">
                                {editingType ? 'Edit Employee Type' : 'Add Employee Type'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
                                    placeholder="e.g., Full-Time, Part-Time, Contract"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
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
                                    placeholder="Brief description of this employee type"
                                />
                                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
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
                                    {processing ? 'Saving...' : editingType ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
