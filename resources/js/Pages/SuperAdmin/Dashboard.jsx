import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Users, Building2, Clock, CheckCircle, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function SuperAdminDashboard({ stats, pendingRequests, recentActivity, financialYear }) {
    const statCards = [
        { name: 'Total Employees', value: stats.totalEmployees, icon: Users, color: 'bg-blue-500' },
        { name: 'Departments', value: stats.totalDepartments, icon: Building2, color: 'bg-green-500' },
        { name: 'Pending Requests', value: stats.pendingRequests, icon: Clock, color: 'bg-yellow-500' },
        { name: 'Approved Today', value: stats.approvedToday, icon: CheckCircle, color: 'bg-purple-500' },
    ];

    return (
        <AuthenticatedLayout title="Super Admin Dashboard">
            <Head title="Super Admin Dashboard" />

            {/* Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {statCards.map((stat) => (
                    <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{stat.value}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending Requests */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Pending Requests</h3>
                        <Link href="/leaves/pending" className="text-sm text-indigo-600 hover:text-indigo-500">
                            View all
                        </Link>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {pendingRequests.length === 0 ? (
                            <li className="px-4 py-4 text-sm text-gray-500">No pending requests</li>
                        ) : (
                            pendingRequests.map((request) => (
                                <li key={request.id} className="px-4 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {request.employee?.user?.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {request.leave_type?.name} - {request.total_days} day(s)
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">
                                                {formatDate(request.start_date)}
                                            </p>
                                            <Link
                                                href={`/leaves/${request.id}`}
                                                className="text-sm text-indigo-600 hover:text-indigo-500"
                                            >
                                                Review
                                            </Link>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                {/* Recent Activity */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {recentActivity.length === 0 ? (
                            <li className="px-4 py-4 text-sm text-gray-500">No recent activity</li>
                        ) : (
                            recentActivity.map((activity) => (
                                <li key={activity.id} className="px-4 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {activity.employee?.user?.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {activity.leave_type?.name} - {activity.status}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">
                                                {activity.approver?.name && `by ${activity.approver.name}`}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {formatDate(activity.approved_at)}
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                        href="/users/create"
                        className="flex items-center gap-2 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                        <Users className="h-5 w-5 text-indigo-600" />
                        <span className="text-sm font-medium">Add User</span>
                    </Link>
                    <Link
                        href="/departments"
                        className="flex items-center gap-2 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                        <Building2 className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium">Manage Departments</span>
                    </Link>
                    <Link
                        href="/leave-types"
                        className="flex items-center gap-2 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                        <Calendar className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm font-medium">Leave Types</span>
                    </Link>
                    <Link
                        href="/reports"
                        className="flex items-center gap-2 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                        <CheckCircle className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium">View Reports</span>
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
