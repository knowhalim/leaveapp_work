import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Edit, Calendar } from 'lucide-react';

export default function LeaveTypeShow({ leaveType }) {
    return (
        <AuthenticatedLayout title={`Leave Type: ${leaveType.name}`}>
            <Head title={leaveType.name} />

            <div className="max-w-3xl mx-auto space-y-6">
                {/* Leave Type Info */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div
                                className="h-12 w-12 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: leaveType.color + '20' }}
                            >
                                <Calendar className="h-6 w-6" style={{ color: leaveType.color }} />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">{leaveType.name}</h3>
                                <p className="text-sm text-gray-500">Code: {leaveType.code}</p>
                            </div>
                        </div>
                        <Link
                            href={`/leave-types/${leaveType.id}/edit`}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <Edit className="h-4 w-4" />
                            Edit
                        </Link>
                    </div>
                    <div className="p-6">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Default Days</dt>
                                <dd className="mt-1 text-sm text-gray-900">{leaveType.default_days} days</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Max Days</dt>
                                <dd className="mt-1 text-sm text-gray-900">{leaveType.max_days ? `${leaveType.max_days} days` : 'No limit'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Paid Leave</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${leaveType.is_paid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {leaveType.is_paid ? 'Yes' : 'No'}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Requires Attachment</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${leaveType.requires_attachment ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {leaveType.requires_attachment ? 'Yes' : 'No'}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Allows Half Day</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${leaveType.allows_half_day ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {leaveType.allows_half_day ? 'Yes' : 'No'}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${leaveType.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {leaveType.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Allowances by Employee Type */}
                {leaveType.allowances && leaveType.allowances.length > 0 && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Allowances by Employee Type</h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {leaveType.allowances.map((allowance) => (
                                    <div key={allowance.id} className="bg-gray-50 rounded-lg p-4 text-center">
                                        <div className="text-sm font-medium text-gray-900">{allowance.employee_type?.name}</div>
                                        <div className="text-2xl font-bold text-gray-900 mt-1">{allowance.days_allowed}</div>
                                        <div className="text-xs text-gray-500">days</div>
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
