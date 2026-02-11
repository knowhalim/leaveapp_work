import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Settings, Calendar, Building2, Mail, Save } from 'lucide-react';

export default function SettingsIndex({ settings }) {
    const { auth } = usePage().props;
    const isSuperAdmin = auth.user?.role === 'super_admin';

    const { data, setData, post, processing, errors } = useForm({
        company_name: settings.company_name || '',
        financial_year: settings.financial_year || new Date().getFullYear().toString(),
        weekends: settings.weekends || ['saturday', 'sunday'],
        max_carry_forward: settings.max_carry_forward || 5,
        leave_year_start_month: settings.leave_year_start_month || 1,
    });

    const weekdays = [
        { value: 'sunday', label: 'Sunday' },
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
    ];

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];

    const handleWeekendToggle = (day) => {
        if (data.weekends.includes(day)) {
            setData('weekends', data.weekends.filter(d => d !== day));
        } else {
            setData('weekends', [...data.weekends, day]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/settings');
    };

    return (
        <AuthenticatedLayout title="System Settings">
            <Head title="System Settings" />

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <a
                        href="/settings"
                        className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
                    >
                        <Settings className="h-4 w-4" />
                        General
                    </a>
                    <a
                        href="/settings/holidays"
                        className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
                    >
                        <Calendar className="h-4 w-4" />
                        Public Holidays
                    </a>
                    <a
                        href="/settings/employee-types"
                        className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
                    >
                        <Building2 className="h-4 w-4" />
                        Employee Types
                    </a>
                    {isSuperAdmin && (
                        <a
                            href="/settings/email"
                            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
                        >
                            <Mail className="h-4 w-4" />
                            Email
                        </a>
                    )}
                </nav>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl">
                <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
                    {/* Company Information */}
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    id="company_name"
                                    value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                {errors.company_name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.company_name}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Leave Year Settings */}
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Leave Year Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="financial_year" className="block text-sm font-medium text-gray-700">
                                    Financial Year
                                </label>
                                <input
                                    type="text"
                                    id="financial_year"
                                    value={data.financial_year}
                                    onChange={(e) => setData('financial_year', e.target.value)}
                                    placeholder="e.g., 2024 or 2024-2025"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                {errors.financial_year && (
                                    <p className="mt-1 text-sm text-red-600">{errors.financial_year}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="leave_year_start_month" className="block text-sm font-medium text-gray-700">
                                    Leave Year Start Month
                                </label>
                                <select
                                    id="leave_year_start_month"
                                    value={data.leave_year_start_month}
                                    onChange={(e) => setData('leave_year_start_month', parseInt(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                >
                                    {months.map((month) => (
                                        <option key={month.value} value={month.value}>
                                            {month.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.leave_year_start_month && (
                                    <p className="mt-1 text-sm text-red-600">{errors.leave_year_start_month}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="max_carry_forward" className="block text-sm font-medium text-gray-700">
                                    Max Carry Forward Days
                                </label>
                                <input
                                    type="number"
                                    id="max_carry_forward"
                                    min="0"
                                    value={data.max_carry_forward}
                                    onChange={(e) => setData('max_carry_forward', parseInt(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                {errors.max_carry_forward && (
                                    <p className="mt-1 text-sm text-red-600">{errors.max_carry_forward}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Weekend Settings */}
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Weekend Days</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Select the days that should be considered weekends (non-working days).
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {weekdays.map((day) => (
                                <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => handleWeekendToggle(day.value)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        data.weekends.includes(day.value)
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                        {errors.weekends && (
                            <p className="mt-2 text-sm text-red-600">{errors.weekends}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="p-6 bg-gray-50 rounded-b-lg">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
