import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Download, User } from 'lucide-react';

export default function EmployeeReport({ employees, departments, filters, financialYear }) {
    const handleFilterChange = (key, value) => {
        router.get('/reports/employee', { ...filters, [key]: value }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout title="Employee Report">
            <Head title="Employee Report" />

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <select
                        value={filters?.department_id || ''}
                        onChange={(e) => handleFilterChange('department_id', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                        <option value="">All Departments</option>
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                    </select>
                    <a
                        href={`/reports/export?type=employee&financial_year=${financialYear}`}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </a>
                </div>
            </div>

            {/* Employee List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Balances</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {employees.data.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No employees found</td>
                            </tr>
                        ) : (
                            employees.data.map((employee) => (
                                <tr key={employee.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                <User className="h-5 w-5 text-gray-500" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{employee.user?.name}</div>
                                                <div className="text-sm text-gray-500">{employee.employee_number}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {employee.department?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {employee.employee_type?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            {employee.leave_balances?.map((balance) => (
                                                <div
                                                    key={balance.id}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                                                    style={{
                                                        backgroundColor: balance.leave_type?.color + '20',
                                                        color: balance.leave_type?.color
                                                    }}
                                                >
                                                    <span className="font-medium">{balance.leave_type?.code}:</span>
                                                    <span>{balance.entitled_days + balance.carried_over + balance.adjustment - balance.used_days - balance.pending_days}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {employees.last_page > 1 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200">
                        <div className="text-sm text-gray-700">
                            Showing {employees.from} to {employees.to} of {employees.total} results
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
