import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function LeaveTypeEdit({ leaveType, employeeTypes }) {
    const existingAllowances = leaveType.allowances || [];

    const { data, setData, put, processing, errors } = useForm({
        name: leaveType.name,
        code: leaveType.code,
        color: leaveType.color,
        default_days: leaveType.default_days,
        max_days: leaveType.max_days || '',
        is_paid: leaveType.is_paid,
        allow_attachment: leaveType.allow_attachment || leaveType.requires_attachment,
        requires_attachment: leaveType.requires_attachment,
        show_at_zero_balance: leaveType.show_at_zero_balance ?? false,
        hide_balance: leaveType.hide_balance ?? false,
        allows_half_day: leaveType.allows_half_day,
        max_backdate_days: leaveType.max_backdate_days || 0,
        is_active: leaveType.is_active,
        allowances: employeeTypes.map(et => {
            const existing = existingAllowances.find(a => a.employee_type_id === et.id);
            return {
                employee_type_id: et.id,
                employee_type_name: et.name,
                days_allowed: existing?.days_allowed || leaveType.default_days,
            };
        }),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/leave-types/${leaveType.id}`);
    };

    const updateAllowance = (index, value) => {
        const newAllowances = [...data.allowances];
        newAllowances[index].days_allowed = parseFloat(value) || 0;
        setData('allowances', newAllowances);
    };

    return (
        <AuthenticatedLayout title="Edit Leave Type">
            <Head title="Edit Leave Type" />

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

                        {/* Attachment options */}
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="allow_attachment"
                                    checked={data.allow_attachment || data.requires_attachment}
                                    disabled={data.requires_attachment}
                                    onChange={(e) => setData('allow_attachment', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-60"
                                />
                                <label htmlFor="allow_attachment" className="ml-2 block text-sm text-gray-700">Allow Attachment</label>
                            </div>
                            <div className="flex items-center pl-6">
                                <input
                                    type="checkbox"
                                    id="requires_attachment"
                                    checked={data.requires_attachment}
                                    onChange={(e) => setData(d => ({
                                        ...d,
                                        requires_attachment: e.target.checked,
                                        allow_attachment: e.target.checked ? true : d.allow_attachment,
                                    }))}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="requires_attachment" className="ml-2 block text-sm text-gray-700">Require Attachment (enforced on submission)</label>
                            </div>
                            <p className="text-xs text-gray-500">If Allow is on, the upload field appears but is optional. If Require is on, the field appears and must be filled.</p>
                        </div>

                        {/* Dropdown visibility */}
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="show_at_zero_balance"
                                    checked={data.show_at_zero_balance}
                                    onChange={(e) => setData('show_at_zero_balance', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="show_at_zero_balance" className="ml-2 block text-sm text-gray-700">Show in apply form even at 0 balance</label>
                            </div>
                            <p className="text-xs text-gray-500">
                                By default, a leave type is hidden from the employee's Apply-for-Leave dropdown once their available balance reaches 0.
                                Turn this on for leave types that should remain selectable even when the balance is 0 — useful for types that allow negative balance,
                                or where the admin expects employees to still request it (the submission balance check still applies).
                            </p>
                            <div className="flex items-center pt-2">
                                <input
                                    type="checkbox"
                                    id="hide_balance"
                                    checked={data.hide_balance}
                                    onChange={(e) => setData('hide_balance', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="hide_balance" className="ml-2 block text-sm text-gray-700">Hide balance in apply dropdown</label>
                            </div>
                            <p className="text-xs text-gray-500">
                                When on, the apply-for-leave dropdown shows just the leave type name (no "(X days left)").
                                Useful for types like Unpaid Leave where displaying a negative balance looks odd.
                            </p>
                        </div>

                        {/* Max Backdate Days */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Max Backdate Days</label>
                            <input
                                type="number"
                                value={data.max_backdate_days}
                                onChange={(e) => setData('max_backdate_days', parseInt(e.target.value) || 0)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                min={0}
                                max={365}
                            />
                            <p className="mt-1 text-sm text-gray-500">Number of days in the past employees can apply for. 0 = no backdating.</p>
                            {errors.max_backdate_days && <p className="mt-1 text-sm text-red-600">{errors.max_backdate_days}</p>}
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
                            {processing ? 'Saving...' : 'Update Leave Type'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
