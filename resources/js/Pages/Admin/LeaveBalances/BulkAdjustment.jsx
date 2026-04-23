import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Users, Calendar, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function BulkAdjustment({ roles, positions, leaveTypes, departments, employeeTypes, financialYear }) {
    const { flash, role_labels } = usePage().props;
    const getRoleLabel = (role) => role_labels?.[role] || role?.replace('_', ' ');
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Show success message when flash changes
    useEffect(() => {
        if (flash?.success) {
            setSuccessMessage(flash.success);
            setShowSuccess(true);
            // Auto-hide after 5 seconds
            const timer = setTimeout(() => setShowSuccess(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    const { data, setData, post, processing, errors } = useForm({
        adjustment_value: '1',
        leave_type_id: '',
        role: '',
        position: '',
        department_id: '',
        employee_type_id: '',
        adjustment_type: 'add',
        field: 'adjustment',
    });

    // Generate adjustment value options (0.5 to 10.0 in 0.5 increments)
    const adjustmentOptions = [];
    for (let i = 0.5; i <= 10; i += 0.5) {
        adjustmentOptions.push(i.toFixed(1));
    }
    // Also add negative values for deductions
    for (let i = -0.5; i >= -10; i -= 0.5) {
        adjustmentOptions.push(i.toFixed(1));
    }
    adjustmentOptions.sort((a, b) => parseFloat(a) - parseFloat(b));

    const fetchPreview = async () => {
        setLoading(true);
        try {
            const response = await window.axios.post('/leave-balances/bulk-adjustment/preview', {
                role: data.role || null,
                position: data.position || null,
                department_id: data.department_id || null,
                employee_type_id: data.employee_type_id || null,
            });
            setPreview(response.data);
        } catch (error) {
            console.error('Preview failed:', error);
            setPreview({ count: 0, employees: [] });
        }
        setLoading(false);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPreview();
        }, 300);
        return () => clearTimeout(timer);
    }, [data.role, data.position, data.department_id, data.employee_type_id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!data.leave_type_id) {
            alert('Please select a leave type');
            return;
        }
        if (preview?.count === 0) {
            alert('No employees match the selected criteria');
            return;
        }
        if (confirm(`Are you sure you want to update ${preview?.count || 0} employee leave balances?`)) {
            post('/leave-balances/bulk-adjustment', {
                preserveScroll: true,
            });
        }
    };

    const getFieldLabel = () => {
        switch (data.field) {
            case 'entitled_days': return 'Entitled Days';
            case 'carried_over': return 'Carried Over';
            case 'adjustment': return 'Adjustment';
            default: return 'Field';
        }
    };

    return (
        <AuthenticatedLayout title="Bulk Leave Adjustment">
            <Head title="Bulk Leave Adjustment" />

            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Bulk Leave Balance Adjustment</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Adjust leave balances for multiple employees at once based on conditions.
                    </p>
                </div>

                {/* Success Message */}
                {showSuccess && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <p className="text-green-800 font-medium">{successMessage}</p>
                        </div>
                        <button
                            onClick={() => setShowSuccess(false)}
                            className="text-green-600 hover:text-green-800"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Adjustment Form */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Adjustment Settings</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Adjustment Value and Type */}
                            <div className="bg-indigo-50 rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Action
                                        </label>
                                        <select
                                            value={data.adjustment_type}
                                            onChange={(e) => setData('adjustment_type', e.target.value)}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="add">Add to existing</option>
                                            <option value="set">Set to value</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Value (days)
                                        </label>
                                        <select
                                            value={data.adjustment_value}
                                            onChange={(e) => setData('adjustment_value', e.target.value)}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            {adjustmentOptions.map((val) => (
                                                <option key={val} value={val}>
                                                    {parseFloat(val) > 0 ? `+${val}` : val}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Field to Update
                                        </label>
                                        <select
                                            value={data.field}
                                            onChange={(e) => setData('field', e.target.value)}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="adjustment">Adjustment</option>
                                            <option value="entitled_days">Entitled Days</option>
                                            <option value="carried_over">Carried Over</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Leave Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={data.leave_type_id}
                                            onChange={(e) => setData('leave_type_id', e.target.value)}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        >
                                            <option value="">Select leave type</option>
                                            {leaveTypes.map((type) => (
                                                <option key={type.id} value={type.id}>
                                                    {type.name} ({type.code})
                                                </option>
                                            ))}
                                        </select>
                                        {errors.leave_type_id && (
                                            <p className="mt-1 text-sm text-red-600">{errors.leave_type_id}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Filter Employees</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Role
                                        </label>
                                        <select
                                            value={data.role}
                                            onChange={(e) => setData('role', e.target.value)}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="">All Roles</option>
                                            {roles.map((role) => (
                                                <option key={role} value={role}>
                                                    {getRoleLabel(role)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Department
                                        </label>
                                        <select
                                            value={data.department_id}
                                            onChange={(e) => setData('department_id', e.target.value)}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="">All Departments</option>
                                            {departments.map((dept) => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Employee Type
                                        </label>
                                        <select
                                            value={data.employee_type_id}
                                            onChange={(e) => setData('employee_type_id', e.target.value)}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="">All Types</option>
                                            {employeeTypes.map((type) => (
                                                <option key={type.id} value={type.id}>
                                                    {type.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Position (contains)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.position}
                                            onChange={(e) => setData('position', e.target.value)}
                                            placeholder="e.g., Manager, Engineer"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            list="position-suggestions"
                                        />
                                        <datalist id="position-suggestions">
                                            {positions.map((pos) => (
                                                <option key={pos} value={pos} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-gray-900">Summary</p>
                                        <p className="text-gray-600 mt-1">
                                            {data.adjustment_type === 'add' ? 'Add' : 'Set'}{' '}
                                            <span className="font-semibold">
                                                {parseFloat(data.adjustment_value) > 0 ? '+' : ''}
                                                {data.adjustment_value}
                                            </span>{' '}
                                            days to <span className="font-semibold">{getFieldLabel()}</span>
                                            {data.leave_type_id && (
                                                <> for <span className="font-semibold">
                                                    {leaveTypes.find(t => t.id == data.leave_type_id)?.name}
                                                </span></>
                                            )}
                                            {preview && (
                                                <> affecting <span className="font-semibold text-indigo-600">
                                                    {preview.count} employees
                                                </span></>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing || !data.leave_type_id || preview?.count === 0}
                                className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CheckCircle className="h-5 w-5" />
                                {processing ? 'Processing...' : `Apply to ${preview?.count || 0} Employees`}
                            </button>
                        </form>
                    </div>

                    {/* Preview Panel */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-indigo-600" />
                                <h3 className="text-lg font-medium text-gray-900">Affected Employees</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-500">FY: {financialYear}</span>
                            </div>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                                    <p className="mt-2 text-sm text-gray-500">Loading preview...</p>
                                </div>
                            ) : preview ? (
                                <>
                                    <div className="mb-4 bg-indigo-50 rounded-lg p-3">
                                        <p className="text-sm text-indigo-800">
                                            <span className="font-bold text-2xl">{preview.count}</span>{' '}
                                            employees match the selected criteria
                                        </p>
                                    </div>
                                    {preview.employees.length > 0 ? (
                                        <div className="max-h-96 overflow-y-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50 sticky top-0">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dept</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {preview.employees.map((emp) => (
                                                        <tr key={emp.id}>
                                                            <td className="px-3 py-2 text-sm text-gray-900">{emp.name}</td>
                                                            <td className="px-3 py-2 text-sm text-gray-500">{emp.position || '-'}</td>
                                                            <td className="px-3 py-2 text-sm text-gray-500">{emp.department || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {preview.count > 100 && (
                                                <p className="mt-2 text-xs text-gray-500 text-center">
                                                    Showing first 100 of {preview.count} employees
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <Users className="h-12 w-12 mx-auto text-gray-300" />
                                            <p className="mt-2">No employees match the selected criteria</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="h-12 w-12 mx-auto text-gray-300" />
                                    <p className="mt-2">Select filters to see affected employees</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
