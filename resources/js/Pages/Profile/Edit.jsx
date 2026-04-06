import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function ProfileEdit({ user }) {
    const employee = user.employee;

    const profileForm = useForm({
        name: user.name || '',
        email: user.email || '',
        phone: employee?.phone || '',
        address: employee?.address || '',
        date_of_birth: employee?.date_of_birth ? employee.date_of_birth.substring(0, 10) : '',
        gender: employee?.gender || '',
        emergency_contact_name: employee?.emergency_contact_name || '',
        emergency_contact_phone: employee?.emergency_contact_phone || '',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        profileForm.put('/profile');
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        passwordForm.put('/profile/password', {
            onSuccess: () => passwordForm.reset(),
        });
    };

    return (
        <AuthenticatedLayout title="My Profile">
            <Head title="My Profile" />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Profile Information */}
                <form onSubmit={handleProfileSubmit}>
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                            <p className="mt-1 text-sm text-gray-500">Update your personal details.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Read-only fields */}
                            {employee && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">Employee Number</label>
                                        <p className="mt-1 text-sm text-gray-900">{employee.employee_number || '—'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">NRIC</label>
                                        <p className="mt-1 text-sm text-gray-900">{employee.nric || '—'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">Department</label>
                                        <p className="mt-1 text-sm text-gray-900">{employee.department?.name || '—'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">Employee Type</label>
                                        <p className="mt-1 text-sm text-gray-900">{employee.employee_type?.name || '—'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">Position</label>
                                        <p className="mt-1 text-sm text-gray-900">{employee.position || '—'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">Hire Date</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : '—'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Editable fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.data.name}
                                        onChange={(e) => profileForm.setData('name', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {profileForm.errors.name && <p className="mt-1 text-sm text-red-600">{profileForm.errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        value={profileForm.data.email}
                                        onChange={(e) => profileForm.setData('email', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {profileForm.errors.email && <p className="mt-1 text-sm text-red-600">{profileForm.errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <input
                                        type="text"
                                        value={profileForm.data.phone}
                                        onChange={(e) => profileForm.setData('phone', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {profileForm.errors.phone && <p className="mt-1 text-sm text-red-600">{profileForm.errors.phone}</p>}
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Address</label>
                                    <textarea
                                        rows={2}
                                        value={profileForm.data.address}
                                        onChange={(e) => profileForm.setData('address', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {profileForm.errors.address && <p className="mt-1 text-sm text-red-600">{profileForm.errors.address}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={profileForm.data.date_of_birth}
                                        onChange={(e) => profileForm.setData('date_of_birth', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {profileForm.errors.date_of_birth && <p className="mt-1 text-sm text-red-600">{profileForm.errors.date_of_birth}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                                    <select
                                        value={profileForm.data.gender}
                                        onChange={(e) => profileForm.setData('gender', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                    {profileForm.errors.gender && <p className="mt-1 text-sm text-red-600">{profileForm.errors.gender}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.data.emergency_contact_name}
                                        onChange={(e) => profileForm.setData('emergency_contact_name', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {profileForm.errors.emergency_contact_name && <p className="mt-1 text-sm text-red-600">{profileForm.errors.emergency_contact_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
                                    <input
                                        type="text"
                                        value={profileForm.data.emergency_contact_phone}
                                        onChange={(e) => profileForm.setData('emergency_contact_phone', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {profileForm.errors.emergency_contact_phone && <p className="mt-1 text-sm text-red-600">{profileForm.errors.emergency_contact_phone}</p>}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                            <button
                                type="submit"
                                disabled={profileForm.processing}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {profileForm.processing ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Change Password */}
                <form onSubmit={handlePasswordSubmit}>
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                            <p className="mt-1 text-sm text-gray-500">Ensure your account uses a strong password.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                    className="mt-1 block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                {passwordForm.errors.current_password && <p className="mt-1 text-sm text-red-600">{passwordForm.errors.current_password}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                                    className="mt-1 block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                {passwordForm.errors.password && <p className="mt-1 text-sm text-red-600">{passwordForm.errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                    className="mt-1 block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                            <button
                                type="submit"
                                disabled={passwordForm.processing}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {passwordForm.processing ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
