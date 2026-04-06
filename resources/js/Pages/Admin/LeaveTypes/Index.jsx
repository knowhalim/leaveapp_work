import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';

export default function LeaveTypesIndex({ leaveTypes }) {
    const handleToggleStatus = (leaveType) => {
        if (confirm(`Are you sure you want to ${leaveType.is_active ? 'deactivate' : 'activate'} this leave type?`)) {
            router.post(`/leave-types/${leaveType.id}/toggle-status`);
        }
    };

    const handleDelete = (leaveType) => {
        if (confirm('Are you sure you want to delete this leave type?')) {
            router.delete(`/leave-types/${leaveType.id}`);
        }
    };

    return (
        <AuthenticatedLayout title="Leave Types">
            <Head title="Leave Types" />

            <div className="mb-6 flex justify-end">
                <Link
                    href="/leave-types/create"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4" />
                    Add Leave Type
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Leave Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Default Days
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Paid
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
                        {leaveTypes.data.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                    No leave types found
                                </td>
                            </tr>
                        ) : (
                            leaveTypes.data.map((leaveType) => (
                                <tr key={leaveType.id}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <span
                                                className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                                                style={{ backgroundColor: leaveType.color }}
                                            />
                                            <span className="text-sm font-medium text-gray-900">{leaveType.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                                            {leaveType.code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {leaveType.default_days} days
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${leaveType.is_paid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {leaveType.is_paid ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${leaveType.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {leaveType.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/leave-types/${leaveType.id}`}
                                                className="text-gray-600 hover:text-gray-900"
                                                title="View"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                            <Link
                                                href={`/leave-types/${leaveType.id}/edit`}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleToggleStatus(leaveType)}
                                                className={leaveType.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                                                title={leaveType.is_active ? 'Deactivate' : 'Activate'}
                                            >
                                                {leaveType.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(leaveType)}
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
