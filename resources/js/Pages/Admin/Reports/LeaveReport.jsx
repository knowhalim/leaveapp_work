import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Download, ExternalLink } from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/utils';

export default function LeaveReport({ leaveRequests, summary, departments, leaveTypes, filters, financialYear }) {
    const handleFilterChange = (key, value) => {
        router.get('/reports/leave', { ...filters, [key]: value }, { preserveState: true });
    };

    const formatTimestamp = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatShortDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    };

    // Calculate request number (simple index-based for display)
    const getRequestNumber = (index) => {
        const page = leaveRequests.current_page || 1;
        const perPage = leaveRequests.per_page || 20;
        return (page - 1) * perPage + index + 1;
    };

    return (
        <AuthenticatedLayout title="Leave Report">
            <Head title="Leave Report" />

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total Requests</div>
                    <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Approved</div>
                    <div className="text-2xl font-bold text-green-600">{summary.approved}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Pending</div>
                    <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Rejected</div>
                    <div className="text-2xl font-bold text-red-600">{summary.rejected}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <select
                        value={filters?.department_id || ''}
                        onChange={(e) => handleFilterChange('department_id', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                        <option value="">All Departments</option>
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                    </select>
                    <select
                        value={filters?.leave_type_id || ''}
                        onChange={(e) => handleFilterChange('leave_type_id', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                        <option value="">All Leave Types</option>
                        {leaveTypes.map((type) => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                    </select>
                    <select
                        value={filters?.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <a
                        href={`/reports/export?type=leave&financial_year=${financialYear}`}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <Download className="h-4 w-4" />
                        Export ZIP (CSV + Attachments)
                    </a>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Timestamp</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Email Address</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">NRIC</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">I am applying for</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Start Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">End Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Duration</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Reason/Notes</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Approver Email</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Attachment</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Request #</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Overall Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {leaveRequests.data.length === 0 ? (
                                <tr>
                                    <td colSpan="13" className="px-4 py-4 text-center text-sm text-gray-500">No records found</td>
                                </tr>
                            ) : (
                                leaveRequests.data.map((request, index) => (
                                    <tr key={request.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {formatTimestamp(request.created_at)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {request.employee?.user?.name}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {request.employee?.user?.email}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {request.employee?.nric || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: request.leave_type?.color }} />
                                                <span className="text-sm text-gray-900">{request.leave_type?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {formatShortDate(request.start_date)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {formatShortDate(request.end_date)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                                            {request.total_days}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={request.reason}>
                                            {request.reason || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {request.approver?.email || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            {request.attachment_path ? (
                                                <a
                                                    href={`/leaves/${request.id}/attachment`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:text-indigo-900 inline-flex items-center gap-1"
                                                >
                                                    View <ExternalLink className="h-3 w-3" />
                                                </a>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                                            {request.id}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                                                {request.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {leaveRequests.last_page > 1 && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {leaveRequests.from} to {leaveRequests.to} of {leaveRequests.total} results
                        </div>
                        <div className="flex gap-2">
                            {leaveRequests.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`px-3 py-1 text-sm rounded ${
                                        link.active
                                            ? 'bg-indigo-600 text-white'
                                            : link.url
                                                ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
