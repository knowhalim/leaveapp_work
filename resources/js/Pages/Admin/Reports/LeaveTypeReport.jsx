import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Calendar, Info } from 'lucide-react';

export default function LeaveTypeReport({ leaveTypes, financialYear, financialYears }) {
    const handleYearChange = (year) => {
        router.get('/reports/leave-type', { financial_year: year }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout title="Leave Type Report">
            <Head title="Leave Type Report" />

            {/* Year selector */}
            <div className="mb-4 flex justify-start">
                <select
                    value={financialYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                >
                    {(financialYears || [financialYear]).map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                    ))}
                </select>
            </div>

            {/* Explanation banner */}
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 text-sm text-blue-800">
                <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                <span>
                    This report shows leave usage by type for the selected financial year.
                    <strong> Total Requests</strong> counts all submitted requests of that type (any status).
                    <strong> Approved</strong> is the number that were approved.
                    <strong> Total Days Used</strong> is the sum of working days deducted across all approved requests of that type.
                    <strong> Default Days</strong> and <strong>Max Days</strong> are the entitlement configuration for that leave type — they are not per-user and do not change with the year filter.
                </span>
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
