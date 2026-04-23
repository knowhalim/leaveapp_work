import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Download, User, Info, ChevronDown, ChevronUp } from 'lucide-react';

export default function EmployeeReport({ employees, departments, positions, leaveTypes, filters, financialYear, financialYears }) {
    const { role_labels } = usePage().props;
    const getRoleLabel = (role) => role_labels?.[role] || role?.replace('_', ' ');

    // Leave type toggle state — all selected by default
    const [selectedIds, setSelectedIds] = useState(() => leaveTypes.map(lt => lt.id));
    const [showLeaveFilter, setShowLeaveFilter] = useState(false);

    const toggleLeaveType = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const allSelected = selectedIds.length === leaveTypes.length;
    const noneSelected = selectedIds.length === 0;

    const handleFilterChange = (key, value) => {
        router.get('/reports/employee', { ...filters, [key]: value }, { preserveState: true });
    };

    const buildExportParams = (type) => {
        const params = new URLSearchParams({ type, financial_year: financialYear });
        selectedIds.forEach(id => params.append('leave_type_ids[]', id));
        if (filters?.search) params.set('search', filters.search);
        if (filters?.department_id) params.set('department_id', filters.department_id);
        if (filters?.position) params.set('position', filters.position);
        if (filters?.role) params.set('role', filters.role);
        return params;
    };

    const handleExportLeave = () => {
        window.location.href = `/reports/export?${buildExportParams('user_leave').toString()}`;
    };

    const handleExportBalance = () => {
        window.location.href = `/reports/export?${buildExportParams('employee').toString()}`;
    };

    return (
        <AuthenticatedLayout title="Leave Summary Report">
            <Head title="Leave Summary Report" />

            {/* Main filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-4 space-y-3">
                <div className="flex flex-wrap gap-3">
                    <input
                        type="text"
                        placeholder="Search name or email..."
                        value={filters?.search || ''}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    />
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
                    <select
                        value={filters?.position || ''}
                        onChange={(e) => handleFilterChange('position', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                        <option value="">All Positions</option>
                        {(positions || []).map((pos) => (
                            <option key={pos} value={pos}>{pos}</option>
                        ))}
                    </select>
                    <select
                        value={filters?.role || ''}
                        onChange={(e) => handleFilterChange('role', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                        <option value="">All Roles</option>
                        <option value="super_admin">{getRoleLabel('super_admin')}</option>
                        <option value="admin">{getRoleLabel('admin')}</option>
                        <option value="manager">{getRoleLabel('manager')}</option>
                        <option value="employee">{getRoleLabel('employee')}</option>
                    </select>
                    <select
                        value={filters?.financial_year || financialYear}
                        onChange={(e) => handleFilterChange('financial_year', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                        {(financialYears || [financialYear]).map((yr) => (
                            <option key={yr} value={yr}>{yr}</option>
                        ))}
                    </select>
                </div>

                {/* Leave type toggle pills */}
                <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between mb-2">
                        <button
                            type="button"
                            onClick={() => setShowLeaveFilter(v => !v)}
                            className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                            {showLeaveFilter ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            Leave Types
                            <span className="ml-1 text-xs font-normal text-gray-400">
                                ({selectedIds.length} of {leaveTypes.length} selected)
                            </span>
                        </button>
                        {showLeaveFilter && (
                            <div className="flex gap-3 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setSelectedIds(leaveTypes.map(lt => lt.id))}
                                    disabled={allSelected}
                                    className="text-indigo-600 hover:text-indigo-800 disabled:opacity-30 disabled:cursor-default"
                                >
                                    Select all
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedIds([])}
                                    disabled={noneSelected}
                                    className="text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-default"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>

                    {showLeaveFilter && (
                        <div className="flex flex-wrap gap-2">
                            {leaveTypes.map(lt => {
                                const active = selectedIds.includes(lt.id);
                                return (
                                    <button
                                        key={lt.id}
                                        type="button"
                                        onClick={() => toggleLeaveType(lt.id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all"
                                        style={active ? {
                                            backgroundColor: lt.color + '20',
                                            borderColor: lt.color,
                                            color: lt.color,
                                        } : {
                                            backgroundColor: '#f3f4f6',
                                            borderColor: '#d1d5db',
                                            color: '#9ca3af',
                                        }}
                                    >
                                        <span
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: active ? lt.color : '#d1d5db' }}
                                        />
                                        {lt.name}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Export buttons */}
                <div className="border-t border-gray-100 pt-3 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleExportBalance}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <Download className="h-4 w-4" />
                        Export Balance Summary
                        {!allSelected && <span className="text-xs text-gray-400">({selectedIds.length} types)</span>}
                    </button>
                    <button
                        type="button"
                        onClick={handleExportLeave}
                        disabled={noneSelected}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="h-4 w-4" />
                        Export Leave Summary Report
                        {!allSelected && <span className="text-xs text-indigo-200">({selectedIds.length} types)</span>}
                    </button>
                </div>
            </div>

            {/* Note banner */}
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 text-sm text-blue-800">
                <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                <span>
                    This report shows a summary of leave balances for selected leave types. Use <strong>Export Leave Summary Report</strong> to download the full list of leave dates taken per user.
                </span>
            </div>

            {/* User List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Balances</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {employees.data.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No users found</td>
                            </tr>
                        ) : (
                            employees.data.map((employee) => {
                                const visibleBalances = employee.leave_balances?.filter(
                                    b => selectedIds.length === 0 || selectedIds.includes(b.leave_type_id)
                                );
                                return (
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
                                                {visibleBalances?.length > 0 ? visibleBalances.map((balance) => (
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
                                                )) : (
                                                    <span className="text-xs text-gray-400">No leave types selected</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {employees.last_page > 1 && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {employees.from} to {employees.to} of {employees.total} results
                        </div>
                        <div className="flex gap-2">
                            {employees.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`px-3 py-1 text-sm rounded ${
                                        link.active
                                            ? 'bg-indigo-600 text-white'
                                            : link.url
                                                ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
