import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Calendar, Users } from 'lucide-react';

export default function UserEdit({ user, departments, employeeTypes, roles, leaveBalances, financialYear, availableSupervisors = [], currentSupervisors = [] }) {
    const { auth, role_labels } = usePage().props;
    const getRoleLabel = (role) => role_labels?.[role] || role?.replace('_', ' ');
    const roleIsLocked = auth.user.role === 'admin' && auth.user.id === user.id;
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        is_active: user.is_active,
        employee_number: user.employee?.employee_number || '',
        nric: user.employee?.nric || '',
        department_id: user.employee?.department_id || '',
        employee_type_id: user.employee?.employee_type_id || '',
        position: user.employee?.position || '',
        hire_date: user.employee?.hire_date ? user.employee.hire_date.substring(0, 10) : '',
        phone: user.employee?.phone || '',
        leave_balances: leaveBalances || [],
        supervisors: currentSupervisors || [],
    });

    const handleLeaveBalanceChange = (index, field, value) => {
        const newBalances = [...data.leave_balances];
        newBalances[index] = {
            ...newBalances[index],
            [field]: parseFloat(value) || 0,
        };
        setData('leave_balances', newBalances);
    };

    const calculateAvailable = (balance) => {
        return (
            parseFloat(balance.entitled_days || 0) +
            parseFloat(balance.carried_over || 0) +
            parseFloat(balance.adjustment || 0) -
            parseFloat(balance.used_days || 0) -
            parseFloat(balance.pending_days || 0)
        ).toFixed(1);
    };

    const addSupervisor = (supervisorId) => {
        const sup = availableSupervisors.find((s) => s.id === parseInt(supervisorId));
        if (!sup || data.supervisors.some((s) => s.id === sup.id)) return;
        setData('supervisors', [...data.supervisors, { ...sup, is_primary: data.supervisors.length === 0 }]);
    };

    const removeSupervisor = (supervisorId) => {
        const updated = data.supervisors.filter((s) => s.id !== supervisorId);
        if (updated.length > 0 && !updated.some((s) => s.is_primary)) {
            updated[0].is_primary = true;
        }
        setData('supervisors', updated);
    };

    const setPrimarySupervisor = (supervisorId) => {
        setData('supervisors', data.supervisors.map((s) => ({ ...s, is_primary: s.id === supervisorId })));
    };

    const filteredSupervisors = availableSupervisors.filter(
        (s) => !data.supervisors.some((ds) => ds.id === s.id) && s.id !== user.employee?.id
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/users/${user.id}`);
    };

    return (
        <AuthenticatedLayout title="Edit User">
            <Head title="Edit User" />

            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Account & Employee Information */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="p-6 space-y-6">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-3">Account Information</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Leave blank to keep current"
                                    />
                                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Role</label>
                                    <select
                                        value={data.role}
                                        onChange={(e) => setData('role', e.target.value)}
                                        disabled={roleIsLocked}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        {roles.map((role) => (
                                            <option key={role} value={role} className="capitalize">
                                                {getRoleLabel(role)}
                                            </option>
                                        ))}
                                    </select>
                                    {roleIsLocked && <p className="mt-1 text-xs text-gray-500">Admins cannot change their own role.</p>}
                                    {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                                </div>

                                <div className="flex items-center pt-6">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">Active</label>
                                </div>
                            </div>

                            <h3 className="text-lg font-medium text-gray-900 border-b pb-3 pt-4">Employee Information</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Employee Number</label>
                                    <input
                                        type="text"
                                        value={data.employee_number}
                                        onChange={(e) => setData('employee_number', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {errors.employee_number && <p className="mt-1 text-sm text-red-600">{errors.employee_number}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">NRIC</label>
                                    <input
                                        type="text"
                                        value={data.nric}
                                        onChange={(e) => setData('nric', e.target.value.toUpperCase())}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="e.g., S1234567A"
                                    />
                                    {errors.nric && <p className="mt-1 text-sm text-red-600">{errors.nric}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Department</label>
                                    <select
                                        value={data.department_id}
                                        onChange={(e) => setData('department_id', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">Select department</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                    {errors.department_id && <p className="mt-1 text-sm text-red-600">{errors.department_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Employee Type</label>
                                    <select
                                        value={data.employee_type_id}
                                        onChange={(e) => setData('employee_type_id', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">Select type</option>
                                        {employeeTypes.map((type) => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                    {errors.employee_type_id && <p className="mt-1 text-sm text-red-600">{errors.employee_type_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Position</label>
                                    <input
                                        type="text"
                                        value={data.position}
                                        onChange={(e) => setData('position', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {errors.position && <p className="mt-1 text-sm text-red-600">{errors.position}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Hire Date</label>
                                    <input
                                        type="date"
                                        value={data.hire_date}
                                        onChange={(e) => setData('hire_date', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {errors.hire_date && <p className="mt-1 text-sm text-red-600">{errors.hire_date}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Supervisors Section */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-600" />
                            <h3 className="text-lg font-medium text-gray-900">Supervisors</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {filteredSupervisors.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Add Supervisor</label>
                                    <select
                                        onChange={(e) => { addSupervisor(e.target.value); e.target.value = ''; }}
                                        defaultValue=""
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="" disabled>Select a supervisor to add...</option>
                                        {filteredSupervisors.map((sup) => (
                                            <option key={sup.id} value={sup.id}>
                                                {sup.name} — {getRoleLabel(sup.role)} {sup.department ? `(${sup.department})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {data.supervisors.length > 0 ? (
                                <div className="space-y-2">
                                    {data.supervisors.map((sup) => (
                                        <div key={sup.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-900">{sup.name}</span>
                                                        {sup.is_primary && (
                                                            <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">Primary</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        {getRoleLabel(sup.role)} {sup.department ? `· ${sup.department}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!sup.is_primary && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPrimarySupervisor(sup.id)}
                                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                                    >
                                                        Set Primary
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSupervisor(sup.id)}
                                                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No supervisors assigned. Only the department manager will be notified for leave requests.</p>
                            )}
                            {errors.supervisors && <p className="mt-1 text-sm text-red-600">{errors.supervisors}</p>}
                        </div>
                    </div>

                    {/* Leave Balances Section */}
                    {data.leave_balances.length > 0 && (
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-indigo-600" />
                                    <h3 className="text-lg font-medium text-gray-900">Leave Balances</h3>
                                </div>
                                <span className="text-sm text-gray-500">Financial Year: {financialYear}</span>
                            </div>
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Entitled</th>
                                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Carried Over</th>
                                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Adjustment</th>
                                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Used</th>
                                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Pending</th>
                                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Available</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {data.leave_balances.map((balance, index) => (
                                                <tr key={balance.leave_type_id}>
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: balance.leave_type_color }}
                                                            />
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {balance.leave_type_name}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                ({balance.leave_type_code})
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            step="0.5"
                                                            min="0"
                                                            value={balance.entitled_days}
                                                            onChange={(e) => handleLeaveBalanceChange(index, 'entitled_days', e.target.value)}
                                                            className="w-20 text-center rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            step="0.5"
                                                            min="0"
                                                            value={balance.carried_over}
                                                            onChange={(e) => handleLeaveBalanceChange(index, 'carried_over', e.target.value)}
                                                            className="w-20 text-center rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            step="0.5"
                                                            value={balance.adjustment}
                                                            onChange={(e) => handleLeaveBalanceChange(index, 'adjustment', e.target.value)}
                                                            className="w-20 text-center rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-center text-sm text-gray-500">
                                                        {balance.used_days}
                                                    </td>
                                                    <td className="px-3 py-2 text-center text-sm text-gray-500">
                                                        {balance.pending_days}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <span className={`text-sm font-semibold ${
                                                            calculateAvailable(balance) >= 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                            {calculateAvailable(balance)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="mt-3 text-xs text-gray-500">
                                    Entitled, Carried Over, and Adjustment fields are editable. Used and Pending are calculated from leave requests.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="bg-white shadow rounded-lg px-6 py-4 flex justify-end gap-3">
                        <a href="/users" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            Cancel
                        </a>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {processing ? 'Saving...' : 'Update User'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
