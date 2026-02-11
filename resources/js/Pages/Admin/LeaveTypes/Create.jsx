import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function LeaveTypeCreate({ employeeTypes }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        color: '#3B82F6',
        default_days: 0,
        max_days: '',
        is_paid: true,
        requires_attachment: false,
        allows_half_day: true,
        is_active: true,
        allowances: employeeTypes.map(et => ({
            employee_type_id: et.id,
            employee_type_name: et.name,
            days_allowed: 0,
        })),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/leave-types');
    };

    const updateAllowance = (index, value) => {
        const newAllowances = [...data.allowances];
        newAllowances[index].days_allowed = parseFloat(value) || 0;
        setData('allowances', newAllowances);
    };

    return (
        <AuthenticatedLayout title="Create Leave Type">
            <Head title="Create Leave Type" />

            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg">
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="e.g., Annual Leave"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Code</label>
                                <input
                                    type="text"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="e.g., AL"
                                    maxLength={10}
                                />
                                {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Color</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                        className="h-10 w-20 rounded border-gray-300"
                                    />
                                    <input
                                        type="text"
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>
                                {errors.color && <p className="mt-1 text-sm text-red-600">{errors.color}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Default Days</label>
                                <input
                                    type="number"
                                    value={data.default_days}
                                    onChange={(e) => setData('default_days', parseInt(e.target.value) || 0)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    min={0}
                                />
                                {errors.default_days && <p className="mt-1 text-sm text-red-600">{errors.default_days}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Max Days (optional)</label>
                                <input
                                    type="number"
                                    value={data.max_days}
                                    onChange={(e) => setData('max_days', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    min={0}
                                />
                                {errors.max_days && <p className="mt-1 text-sm text-red-600">{errors.max_days}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_paid"
                                    checked={data.is_paid}
                                    onChange={(e) => setData('is_paid', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="is_paid" className="ml-2 block text-sm text-gray-700">Paid Leave</label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="requires_attachment"
                                    checked={data.requires_attachment}
                                    onChange={(e) => setData('requires_attachment', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="requires_attachment" className="ml-2 block text-sm text-gray-700">Requires Attachment</label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="allows_half_day"
                                    checked={data.allows_half_day}
                                    onChange={(e) => setData('allows_half_day', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="allows_half_day" className="ml-2 block text-sm text-gray-700">Allows Half Day</label>
                            </div>

                            <div className="flex items-center">
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

                        {/* Allowances by Employee Type */}
                        <div className="border-t pt-6">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Allowances by Employee Type</h3>
                            <div className="space-y-3">
                                {data.allowances.map((allowance, index) => (
                                    <div key={allowance.employee_type_id} className="flex items-center gap-4">
                                        <label className="w-32 text-sm text-gray-700">{allowance.employee_type_name}</label>
                                        <input
                                            type="number"
                                            value={allowance.days_allowed}
                                            onChange={(e) => updateAllowance(index, e.target.value)}
                                            className="w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                            min={0}
                                            step={0.5}
                                        />
                                        <span className="text-sm text-gray-500">days</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                        <a href="/leave-types" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            Cancel
                        </a>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {processing ? 'Creating...' : 'Create Leave Type'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
