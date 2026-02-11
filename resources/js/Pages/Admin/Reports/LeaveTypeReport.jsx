import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Calendar } from 'lucide-react';

export default function LeaveTypeReport({ leaveTypes, financialYear }) {
    return (
        <AuthenticatedLayout title="Leave Type Report">
            <Head title="Leave Type Report" />

            <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900">Financial Year: {financialYear}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leaveTypes.map((leaveType) => (
                    <div key={leaveType.id} className="bg-white rounded-lg shadow overflow-hidden">
                        <div
                            className="h-2"
                            style={{ backgroundColor: leaveType.color }}
                        />
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: leaveType.color + '20' }}
                                >
                                    <Calendar className="h-5 w-5" style={{ color: leaveType.color }} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">{leaveType.name}</h3>
                                    <p className="text-sm text-gray-500">Code: {leaveType.code}</p>
                                </div>
                            </div>

                            <dl className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <dt className="text-xs text-gray-500">Total Requests</dt>
                                    <dd className="text-xl font-bold text-gray-900">{leaveType.stats?.total_requests || 0}</dd>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3">
                                    <dt className="text-xs text-gray-500">Approved</dt>
                                    <dd className="text-xl font-bold text-green-600">{leaveType.stats?.approved || 0}</dd>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-3 col-span-2">
                                    <dt className="text-xs text-gray-500">Total Days Used</dt>
                                    <dd className="text-xl font-bold text-blue-600">{leaveType.stats?.total_days || 0}</dd>
                                </div>
                            </dl>

                            <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                                <div className="flex justify-between">
                                    <span>Default Days:</span>
                                    <span className="font-medium">{leaveType.default_days}</span>
                                </div>
                                {leaveType.max_days && (
                                    <div className="flex justify-between">
                                        <span>Max Days:</span>
                                        <span className="font-medium">{leaveType.max_days}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {leaveTypes.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500">No leave types found.</p>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
