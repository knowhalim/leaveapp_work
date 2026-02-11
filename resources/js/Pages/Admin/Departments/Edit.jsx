import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function DepartmentEdit({ department, managers }) {
    const { data, setData, put, processing, errors } = useForm({
        name: department.name,
        manager_id: department.manager_id || '',
        is_active: department.is_active,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/departments/${department.id}`);
    };

    return (
        <AuthenticatedLayout title="Edit Department">
            <Head title="Edit Department" />

            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg">
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Department Name
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Department Manager
                            </label>
                            <select
                                value={data.manager_id}
                                onChange={(e) => setData('manager_id', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">Select manager (optional)</option>
                                {managers.map((manager) => (
                                    <option key={manager.id} value={manager.id}>
                                        {manager.name} ({manager.email})
                                    </option>
                                ))}
                            </select>
                            {errors.manager_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.manager_id}</p>
                            )}
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                                Active
                            </label>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                        <a
                            href="/departments"
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Cancel
                        </a>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {processing ? 'Saving...' : 'Update Department'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
