import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function LeaveBalances({ balances, financialYear, error }) {
    if (error) {
        return (
            <AuthenticatedLayout title="My Leave Balances">
                <Head title="My Leave Balances" />
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{error}</p>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout title={`My Leave Balances (${financialYear})`}>
            <Head title="My Leave Balances" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {balances.map((balance) => (
                    <div key={balance.id} className="bg-white rounded-lg shadow overflow-hidden">
                        <div
                            className="h-2"
                            style={{ backgroundColor: balance.leave_type?.color || '#3B82F6' }}
                        />
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {balance.leave_type?.name}
                                </h3>
                                <span className="text-sm text-gray-500">{balance.leave_type?.code}</span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Entitled Days</span>
                                    <span className="font-medium">{balance.entitled_days}</span>
                                </div>
                                {balance.carried_over > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Carried Over</span>
                                        <span className="font-medium text-blue-600">+{balance.carried_over}</span>
                                    </div>
                                )}
                                {balance.adjustment !== 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Adjustment</span>
                                        <span className={`font-medium ${balance.adjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {balance.adjustment >= 0 ? '+' : ''}{balance.adjustment}
                                        </span>
                                    </div>
                                )}
                                <div className="border-t pt-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total Entitled</span>
                                        <span className="font-semibold">
                                            {balance.entitled_days + balance.carried_over + balance.adjustment}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Used</span>
                                    <span className="font-medium text-red-600">-{balance.used_days}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Pending</span>
                                    <span className="font-medium text-yellow-600">-{balance.pending_days}</span>
                                </div>
                                <div className="border-t pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-700 font-medium">Available</span>
                                        <span className="text-xl font-bold text-green-600">
                                            {balance.entitled_days + balance.carried_over + balance.adjustment - balance.used_days - balance.pending_days}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-4">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full"
                                        style={{
                                            width: `${Math.min(100, ((balance.used_days + balance.pending_days) / (balance.entitled_days + balance.carried_over + balance.adjustment)) * 100)}%`,
                                            backgroundColor: balance.leave_type?.color || '#3B82F6',
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1 text-right">
                                    {balance.used_days + balance.pending_days} / {balance.entitled_days + balance.carried_over + balance.adjustment} days used
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {balances.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500">No leave balances found for this financial year.</p>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
