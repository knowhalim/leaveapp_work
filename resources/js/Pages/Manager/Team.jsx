import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDate, getStatusColor } from '@/lib/utils';
import { Calendar, Clock, BookOpen, Users } from 'lucide-react';

export default function ManagerTeam({ upcomingLeave, leaveHistory, leaveBalances, teamMembers, financialYear }) {
    const { role_labels } = usePage().props;
    const getRoleLabel = (role) => role_labels?.[role] || role?.replace('_', ' ');
    const [activeTab, setActiveTab] = useState('upcoming');
    const [selectedMember, setSelectedMember] = useState('all');

    const tabs = [
        { key: 'upcoming', label: 'Upcoming Leave', icon: Calendar },
        { key: 'history', label: 'Leave History', icon: Clock },
        { key: 'balances', label: 'Leave Balances', icon: BookOpen },
        { key: 'members', label: 'Members', icon: Users },
    ];

    const filteredMembers = selectedMember === 'all'
        ? teamMembers
        : teamMembers.filter(m => m.id == selectedMember);

    const filteredUpcoming = selectedMember === 'all'
        ? upcomingLeave
        : upcomingLeave.filter(l => l.employee_id == selectedMember);

    const filteredHistory = selectedMember === 'all'
        ? leaveHistory.data
        : leaveHistory.data.filter(l => l.employee_id == selectedMember);

    return (
        <AuthenticatedLayout title="My Team">
            <Head title="My Team" />

            {/* Member filter */}
            <div className="mb-4 flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Filter by member:</label>
                <select
                    value={selectedMember}
                    onChange={e => setSelectedMember(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                >
                    <option value="all">All Members</option>
                    {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.user?.name}</option>
                    ))}
                </select>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                                activeTab === tab.key
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Upcoming Leave */}
            {activeTab === 'upcoming' && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {[getRoleLabel('employee'), 'Leave Type', 'Start', 'End', 'Days', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUpcoming.length === 0 ? (
                                <tr><td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">No upcoming leave</td></tr>
                            ) : filteredUpcoming.map(leave => (
                                <tr key={leave.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{leave.employee?.user?.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: leave.leave_type?.color }} />
                                            {leave.leave_type?.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(leave.start_date)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(leave.end_date)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leave.total_days}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(leave.status)}`}>{leave.status}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <Link href={`/leaves/${leave.id}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Leave History */}
            {activeTab === 'history' && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {[getRoleLabel('employee'), 'Leave Type', 'Start', 'End', 'Days', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredHistory.length === 0 ? (
                                <tr><td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">No leave history</td></tr>
                            ) : filteredHistory.map(leave => (
                                <tr key={leave.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{leave.employee?.user?.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: leave.leave_type?.color }} />
                                            {leave.leave_type?.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(leave.start_date)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(leave.end_date)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leave.total_days}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(leave.status)}`}>{leave.status}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <Link href={`/leaves/${leave.id}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {leaveHistory.last_page > 1 && (
                        <div className="px-6 py-3 bg-gray-50 border-t text-sm text-gray-500">
                            Showing {leaveHistory.from}–{leaveHistory.to} of {leaveHistory.total}
                        </div>
                    )}
                </div>
            )}

            {/* Members */}
            {activeTab === 'members' && (
                <div className="space-y-4">
                    {filteredMembers.length === 0 ? (
                        <div className="bg-white shadow rounded-lg p-6 text-center text-sm text-gray-500">No team members</div>
                    ) : filteredMembers.map(member => (
                        <div key={member.id} className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-sm font-semibold text-gray-900">{member.user?.name}</h3>
                                <p className="text-xs text-gray-500">{member.user?.email} · {getRoleLabel(member.user?.role)}</p>
                            </div>
                            <div className="p-6">
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                                    <div>
                                        <dt className="text-xs font-medium text-gray-500 uppercase">Phone</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{member.phone || '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-gray-500 uppercase">Date of Birth</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{member.date_of_birth ? formatDate(member.date_of_birth) : '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-gray-500 uppercase">Gender</dt>
                                        <dd className="mt-1 text-sm text-gray-900 capitalize">{member.gender || '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-gray-500 uppercase">Position</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{member.position || '—'}</dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-xs font-medium text-gray-500 uppercase">Address</dt>
                                        <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{member.address || '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-gray-500 uppercase">Emergency Contact Name</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{member.emergency_contact_name || '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-gray-500 uppercase">Emergency Contact Phone</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{member.emergency_contact_phone || '—'}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Leave Balances */}
            {activeTab === 'balances' && (
                <div className="space-y-6">
                    {teamMembers
                        .filter(m => selectedMember === 'all' || m.id == selectedMember)
                        .map(member => {
                            const balances = leaveBalances[member.id] || [];
                            return (
                                <div key={member.id} className="bg-white shadow rounded-lg overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                        <h3 className="text-sm font-semibold text-gray-900">{member.user?.name}</h3>
                                        <p className="text-xs text-gray-500">Financial Year: {financialYear}</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead>
                                                <tr>
                                                    {['Leave Type', 'Entitled', 'Carried Over', 'Adjustment', 'Used', 'Pending', 'Available'].map(h => (
                                                        <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {balances.length === 0 ? (
                                                    <tr><td colSpan="7" className="px-4 py-3 text-sm text-gray-400 text-center">No balances found</td></tr>
                                                ) : balances.map(b => {
                                                    const available = b.entitled_days + b.carried_over + b.adjustment - b.used_days - b.pending_days;
                                                    return (
                                                        <tr key={b.id}>
                                                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                                                <span className="flex items-center gap-1.5">
                                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.leave_type?.color }} />
                                                                    {b.leave_type?.name}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-600">{b.entitled_days}</td>
                                                            <td className="px-4 py-2 text-sm text-gray-600">{b.carried_over}</td>
                                                            <td className="px-4 py-2 text-sm text-gray-600">{b.adjustment >= 0 ? '+' : ''}{b.adjustment}</td>
                                                            <td className="px-4 py-2 text-sm text-gray-600">{b.used_days}</td>
                                                            <td className="px-4 py-2 text-sm text-gray-600">{b.pending_days}</td>
                                                            <td className="px-4 py-2 text-sm font-semibold text-gray-900">{available}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
