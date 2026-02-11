import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Users, Clock, Calendar, CheckCircle } from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/utils';

export default function ManagerDashboard({ stats, pendingRequests, todayOnLeave, teamMembers, financialYear }) {
    const statCards = [
        { name: 'Team Size', value: stats.teamSize, icon: Users, color: 'bg-blue-500' },
        { name: 'Pending Requests', value: stats.pendingRequests, icon: Clock, color: 'bg-yellow-500' },
        { name: 'On Leave Today', value: stats.onLeaveToday, icon: Calendar, color: 'bg-green-500' },
    ];

    return (
        <AuthenticatedLayout title="Manager Dashboard">
            <Head title="Manager Dashboard" />

            {/* Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
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
                        <h3 className="text-lg font-medium text-gray-900">Pending Approvals</h3>
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
                                            <p className="text-xs text-gray-400">
                                                {formatDate(request.start_date)} - {formatDate(request.end_date)}
                                            </p>
                                        </div>
                                        <Link
                                            href={`/leaves/${request.id}`}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                        >
                                            Review
                                        </Link>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                {/* On Leave Today */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Team Members On Leave Today</h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {todayOnLeave.length === 0 ? (
                            <li className="px-4 py-4 text-sm text-gray-500">No one on leave today</li>
                        ) : (
                            todayOnLeave.map((leave) => (
                                <li key={leave.id} className="px-4 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {leave.employee?.user?.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {leave.leave_type?.name}
                                            </p>
                                        </div>
                                        <div className="text-right text-sm text-gray-500">
                                            <p>{formatDate(leave.start_date)} - {formatDate(leave.end_date)}</p>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            {/* Team Members */}
            <div className="mt-8">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
                    </div>
                    <div className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {teamMembers.map((member) => (
                                <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <span className="text-sm font-medium text-indigo-600">
                                            {member.user?.name?.charAt(0)?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{member.user?.name}</p>
                                        <p className="text-xs text-gray-500">{member.position}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
