import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Edit, User, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function UserShow({ user }) {
    const { role_labels } = usePage().props;
    const getRoleLabel = (role) => role_labels?.[role] || role?.replace('_', ' ');
    return (
        <AuthenticatedLayout title={`User: ${user.name}`}>
            <Head title={user.name} />

            <div className="max-w-3xl mx-auto space-y-6">
                {/* User Info */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                <User className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                        </div>
                        <Link
                            href={`/users/${user.id}/edit`}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <Edit className="h-4 w-4" />
                            Edit
                        </Link>
                    </div>
                    <div className="p-6">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Role</dt>
                                <dd className="mt-1 text-sm text-gray-900 capitalize">{getRoleLabel(user.role)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                                <dd className="mt-1 text-sm text-gray-900">{user.last_login_at ? formatDate(user.last_login_at) : 'Never'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Created</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatDate(user.created_at)}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Employee Info */}
                {user.employee && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">User Information</h3>
                        </div>
                        <div className="p-6">
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Employee Number</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{user.employee.employee_number}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Department</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{user.employee.department?.name || 'Not assigned'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Position</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{user.employee.position || 'Not specified'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Employee Type</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{user.employee.employee_type?.name || 'Not specified'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Hire Date</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{user.employee.hire_date ? formatDate(user.employee.hire_date) : 'Not specified'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{user.employee.phone || 'Not specified'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{user.employee.date_of_birth ? formatDate(user.employee.date_of_birth) : 'Not specified'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Gender</dt>
                                    <dd className="mt-1 text-sm text-gray-900 capitalize">{user.employee.gender || 'Not specified'}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{user.employee.address || 'Not specified'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Emergency Contact Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{user.employee.emergency_contact_name || 'Not specified'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Emergency Contact Phone</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{user.employee.emergency_contact_phone || 'Not specified'}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}

                {/* Supervisors */}
                {user.employee?.supervisors && user.employee.supervisors.length > 0 && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-600" />
                            <h3 className="text-lg font-medium text-gray-900">Supervisors <span className="text-sm font-normal text-gray-500">(Leave Approver)</span></h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                {user.employee.supervisors.map((sup) => (
                                    <div key={sup.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900">{sup.user?.name}</span>
                                                {sup.pivot?.is_primary ? (
                                                    <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">Primary</span>
                                                ) : null}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {getRoleLabel(sup.user?.role)} {sup.department?.name ? `· ${sup.department.name}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Leave Balances */}
                {user.employee?.leave_balances && user.employee.leave_balances.length > 0 && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Leave Balances</h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {user.employee.leave_balances.map((balance) => (
                                    <div key={balance.id} className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: balance.leave_type?.color }}
                                            />
                                            <span className="text-sm font-medium text-gray-900">{balance.leave_type?.name}</span>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {balance.entitled_days + balance.carried_over + balance.adjustment - balance.used_days - balance.pending_days}
                                        </div>
                                        <div className="text-xs text-gray-500">days available</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
