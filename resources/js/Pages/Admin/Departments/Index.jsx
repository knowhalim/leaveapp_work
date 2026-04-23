import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, Edit, Trash2, Eye, Users, ToggleLeft, ToggleRight } from 'lucide-react';

export default function DepartmentsIndex({ departments, filters }) {
    const { role_labels } = usePage().props;
    const getRoleLabel = (role) => role_labels?.[role] || role?.replace('_', ' ');
    const handleFilterChange = (key, value) => {
        router.get('/departments', { ...filters, [key]: value }, { preserveState: true });
    };

    const handleToggleStatus = (department) => {
        if (confirm(`Are you sure you want to ${department.is_active ? 'deactivate' : 'activate'} this department?`)) {
            router.post(`/departments/${department.id}/toggle-status`);
        }
    };

    const handleDelete = (department) => {
        if (confirm('Are you sure you want to delete this department?')) {
            router.delete(`/departments/${department.id}`);
        }
    };

    return (
        <AuthenticatedLayout title="Department Management">
            <Head title="Departments" />

            <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-wrap gap-4">
                    <input
                        type="text"
                        placeholder="Search departments..."
                        value={filters?.search || ''}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    />
                    <select
                        value={filters?.status || 'all'}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <Link
                    href="/departments/create"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4" />
                    Add Department
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Department
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {getRoleLabel('manager')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {getRoleLabel('employee')}s
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
                        {departments.data.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                    No departments found
                                </td>
                            </tr>
                        ) : (
                            departments.data.map((department) => (
                                <tr key={department.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                <Users className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{department.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-900">
                                            {department.manager?.name || 'Not assigned'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {department.employees_count} {getRoleLabel('employee')}s
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${department.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {department.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/departments/${department.id}`}
                                                className="text-gray-600 hover:text-gray-900"
                                                title="View"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                            <Link
                                                href={`/departments/${department.id}/edit`}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleToggleStatus(department)}
                                                className={department.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                                                title={department.is_active ? 'Deactivate' : 'Activate'}
                                            >
                                                {department.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(department)}
                                                className="text-red-600 hover:text-red-900"
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
            </div>
        </AuthenticatedLayout>
    );
}
