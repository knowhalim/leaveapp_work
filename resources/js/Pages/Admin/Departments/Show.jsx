import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Edit, Users, Building2 } from 'lucide-react';

export default function DepartmentShow({ department, stats }) {
    const { role_labels } = usePage().props;
    const getRoleLabel = (role) => role_labels?.[role] || role?.replace('_', ' ');
    return (
        <AuthenticatedLayout title={`Department: ${department.name}`}>
            <Head title={department.name} />

            <div className="space-y-6">
                {/* Department Info */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">{department.name}</h3>
                                <p className="text-sm text-gray-500">
                                    {getRoleLabel('manager')}: {department.manager?.name || 'Not assigned'}
                                </p>
                            </div>
                        </div>
                        <Link
                            href={`/departments/${department.id}/edit`}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <Edit className="h-4 w-4" />
                            Edit
                        </Link>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <dt className="text-sm font-medium text-blue-700">Total {getRoleLabel('employee')}s</dt>
                                <dd className="mt-1 text-2xl font-semibold text-blue-900">{stats.totalEmployees}</dd>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                                <dt className="text-sm font-medium text-green-700">Active {getRoleLabel('employee')}s</dt>
                                <dd className="mt-1 text-2xl font-semibold text-green-900">{stats.activeEmployees}</dd>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Employees List */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Department {getRoleLabel('employee')}s</h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {department.employees?.length === 0 ? (
                            <li className="px-4 py-4 text-sm text-gray-500">No {getRoleLabel('employee')}s in this department</li>
                        ) : (
                            department.employees?.map((employee) => (
                                <li key={employee.id} className="px-4 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                <span className="text-sm font-medium text-gray-600">
                                                    {employee.user?.name?.charAt(0)?.toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{employee.user?.name}</p>
                                                <p className="text-sm text-gray-500">{employee.position || 'No position'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">{employee.employee_number}</p>
                                            <p className="text-xs text-gray-400">{employee.employee_type?.name}</p>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
