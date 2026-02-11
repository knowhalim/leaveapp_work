import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Building2, Download } from 'lucide-react';

export default function DepartmentReport({ departments, financialYear }) {
    return (
        <AuthenticatedLayout title="Department Report">
            <Head title="Department Report" />

            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Financial Year: {financialYear}</h2>
                <a
                    href={`/reports/export?type=department&financial_year=${financialYear}`}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                    <Download className="h-4 w-4" />
                    Export CSV
                </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((department) => (
                    <div key={department.id} className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                    <Building2 className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">{department.name}</h3>
                                    <p className="text-sm text-gray-500">{department.employees_count} employees</p>
                                </div>
                            </div>

                            <dl className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <dt className="text-xs text-gray-500">Total Requests</dt>
                                    <dd className="text-xl font-bold text-gray-900">{department.leave_stats?.total_requests || 0}</dd>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3">
                                    <dt className="text-xs text-gray-500">Approved</dt>
                                    <dd className="text-xl font-bold text-green-600">{department.leave_stats?.approved || 0}</dd>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-3 col-span-2">
                                    <dt className="text-xs text-gray-500">Total Days Taken</dt>
                                    <dd className="text-xl font-bold text-blue-600">{department.leave_stats?.total_days_taken || 0}</dd>
                                </div>
                            </dl>

                            {department.manager && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-xs text-gray-500">Manager</p>
                                    <p className="text-sm font-medium text-gray-900">{department.manager.name}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {departments.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500">No departments found.</p>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
