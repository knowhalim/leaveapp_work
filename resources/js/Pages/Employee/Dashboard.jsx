import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Calendar, Clock, Plus, FileText } from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/utils';

export default function EmployeeDashboard({ employee, leaveBalances, recentRequests, pendingRequests, upcomingLeave, financialYear, error }) {
    if (error) {
        return (
            <AuthenticatedLayout title="Dashboard">
                <Head title="Dashboard" />
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{error}</p>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout title="My Dashboard">
            <Head title="Dashboard" />

            {/* Leave Balances */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Leave Balances ({financialYear})</h3>
                    <Link
                        href="/leaves/create"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" />
                        Apply for Leave
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {leaveBalances.map((balance) => (
                        <div key={balance.id} className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span
                                    className="inline-block w-3 h-3 rounded-full"
                                    style={{ backgroundColor: balance.leave_type?.color || '#3B82F6' }}
                                />
                                <span className="text-xs text-gray-500">{balance.leave_type?.code}</span>
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">{balance.leave_type?.name}</h4>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Entitled:</span>
                                    <span className="font-medium">{balance.entitled_days + balance.carried_over + balance.adjustment}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Used:</span>
                                    <span className="text-red-600">{balance.used_days}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Pending:</span>
                                    <span className="text-yellow-600">{balance.pending_days}</span>
                                </div>
                                <div className="flex justify-between border-t pt-1 mt-1">
                                    <span className="text-gray-700 font-medium">Available:</span>
                                    <span className="font-semibold text-green-600">
                                        {balance.entitled_days + balance.carried_over + balance.adjustment - balance.used_days - balance.pending_days}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Requests */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Recent Requests</h3>
                        <Link href="/leaves" className="text-sm text-indigo-600 hover:text-indigo-500">
                            View all
                        </Link>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {recentRequests.length === 0 ? (
                            <li className="px-4 py-4 text-sm text-gray-500">No leave requests yet</li>
                        ) : (
                            recentRequests.map((request) => (
                                <li key={request.id} className="px-4 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {request.leave_type?.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatDate(request.start_date)} - {formatDate(request.end_date)}
                                            </p>
                                            <p className="text-xs text-gray-400">{request.total_days} day(s)</p>
                                        </div>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                {/* Upcoming Leave */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Upcoming Leave</h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {upcomingLeave.length === 0 ? (
                            <li className="px-4 py-4 text-sm text-gray-500">No upcoming leave</li>
                        ) : (
                            upcomingLeave.map((leave) => (
                                <li key={leave.id} className="px-4 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {leave.leave_type?.name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-500">{leave.total_days} day(s)</span>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            {/* Employee Info */}
            <div className="mt-8 bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">My Information</h3>
                </div>
                <div className="p-4">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Employee Number</dt>
                            <dd className="mt-1 text-sm text-gray-900">{employee?.employee_number}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Department</dt>
                            <dd className="mt-1 text-sm text-gray-900">{employee?.department?.name || 'Not assigned'}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Position</dt>
                            <dd className="mt-1 text-sm text-gray-900">{employee?.position || 'Not specified'}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Employee Type</dt>
                            <dd className="mt-1 text-sm text-gray-900">{employee?.employee_type?.name || 'Not specified'}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
