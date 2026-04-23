import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, Eye, Paperclip, X } from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/utils';

export default function LeaveIndex({ leaveRequests, leaveTypes, filters }) {
    const [approversModalRequest, setApproversModalRequest] = useState(null);

    const approverInfo = (request) => {
        // Processed leave: show who actually approved/rejected it
        if (request.approver?.name) {
            return { name: request.approver.name, extra: 0, sups: [], processed: true };
        }
        const sups = request.employee?.supervisors || [];
        if (sups.length === 0) return { name: '—', extra: 0, sups: [], processed: false };
        const primary = sups.find((s) => s.pivot?.is_primary) || sups[0];
        return { name: primary?.user?.name || '—', extra: sups.length - 1, sups, processed: false };
    };

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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Approver
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {leaveRequests.data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
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
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: request.leave_type?.color }}
                                            />
                                            <span className="text-sm text-gray-900">{request.leave_type?.name}</span>
                                            {request.attachment_path && (
                                                <Paperclip className="h-3.5 w-3.5 text-gray-400" title="Has attachment" />
                                            )}
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {(() => {
                                            const { name, extra, processed } = approverInfo(request);
                                            if (!processed && extra > 0) {
                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={() => setApproversModalRequest(request)}
                                                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                                                        title="View all approvers"
                                                    >
                                                        {name} +{extra}
                                                    </button>
                                                );
                                            }
                                            return <span>{name}</span>;
                                        })()}
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

            {approversModalRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Approvers for {approversModalRequest.employee?.user?.name}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {(approversModalRequest.employee?.supervisors || []).length} approver(s) assigned
                                </p>
                            </div>
                            <button
                                onClick={() => setApproversModalRequest(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
                            {(approversModalRequest.employee?.supervisors || []).map((sup) => (
                                <div key={sup.id} className="flex items-center gap-3 px-3 py-2 rounded-md bg-gray-50">
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-medium text-indigo-600">
                                            {sup.user?.name?.charAt(0)?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900 truncate">
                                                {sup.user?.name || '—'}
                                            </span>
                                            {sup.pivot?.is_primary && (
                                                <span className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded bg-indigo-100 text-indigo-700">
                                                    Primary
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">{sup.user?.email}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="px-5 py-4 border-t flex justify-end">
                            <button
                                onClick={() => setApproversModalRequest(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
