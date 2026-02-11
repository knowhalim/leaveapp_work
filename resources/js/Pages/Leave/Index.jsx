import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, Eye } from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/utils';

export default function LeaveIndex({ leaveRequests, leaveTypes, filters }) {
    const handleFilterChange = (key, value) => {
        router.get('/leaves', { ...filters, [key]: value }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout title="Leave Requests">
            <Head title="Leave Requests" />

            <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-wrap gap-4">
                    <select
                        value={filters?.status || 'all'}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                        value={filters?.leave_type || 'all'}
                        onChange={(e) => handleFilterChange('leave_type', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                        <option value="all">All Leave Types</option>
                        {leaveTypes.map((type) => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                    </select>
                </div>
                <Link
                    href="/leaves/create"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4" />
                    Apply for Leave
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Employee
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Leave Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Duration
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Days
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
                        {leaveRequests.data.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                    No leave requests found
                                </td>
                            </tr>
                        ) : (
                            leaveRequests.data.map((request) => (
                                <tr key={request.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {request.employee?.user?.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {request.employee?.department?.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span
                                                className="w-2 h-2 rounded-full mr-2"
                                                style={{ backgroundColor: request.leave_type?.color }}
                                            />
                                            <span className="text-sm text-gray-900">{request.leave_type?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(request.start_date)} - {formatDate(request.end_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {request.total_days}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link
                                            href={`/leaves/${request.id}`}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {leaveRequests.links && leaveRequests.links.length > 3 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            {leaveRequests.prev_page_url && (
                                <Link href={leaveRequests.prev_page_url} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                    Previous
                                </Link>
                            )}
                            {leaveRequests.next_page_url && (
                                <Link href={leaveRequests.next_page_url} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                    Next
                                </Link>
                            )}
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{leaveRequests.from}</span> to{' '}
                                <span className="font-medium">{leaveRequests.to}</span> of{' '}
                                <span className="font-medium">{leaveRequests.total}</span> results
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
