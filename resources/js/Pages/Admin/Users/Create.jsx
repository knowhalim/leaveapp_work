import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Users } from 'lucide-react';

export default function UserCreate({ departments, employeeTypes, roles, availableSupervisors = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        is_active: true,
        employee_number: '',
        nric: '',
        department_id: '',
        employee_type_id: '',
        position: '',
        hire_date: '',
        phone: '',
        send_welcome_email: true,
        supervisors: [],
    });

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
        (s) => !data.supervisors.some((ds) => ds.id === s.id)
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/users');
    };

    return (
        <AuthenticatedLayout title="Create User">
            <Head title="Create User" />

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
                                    />
                                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Role</label>
                                    <select
                                        value={data.role}
                                        onChange={(e) => setData('role', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        {roles.map((role) => (
                                            <option key={role} value={role} className="capitalize">
                                                {role.replace('_', ' ')}
                                            </option>
                                        ))}
                                    </select>
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

                                <div className="col-span-2 pt-2">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="send_welcome_email"
                                            checked={data.send_welcome_email}
                                            onChange={(e) => setData('send_welcome_email', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="send_welcome_email" className="ml-2 block text-sm text-gray-700">
                                            Send welcome email with login credentials
                                        </label>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500 ml-6">
                                        The user will receive an onboarding email with their login details and role-specific instructions.
                                    </p>
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
                                        placeholder="e.g., EMP005"
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
                                                {sup.name} — {sup.role.replace('_', ' ')} {sup.department ? `(${sup.department})` : ''}
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
                                                        {sup.role.replace('_', ' ')} {sup.department ? `· ${sup.department}` : ''}
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
                            {processing ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
