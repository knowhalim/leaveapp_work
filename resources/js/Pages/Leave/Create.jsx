import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function LeaveCreate({ leaveTypes, leaveBalances, financialYear }) {
    const { data, setData, post, processing, errors } = useForm({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        start_half: 'full',
        end_half: 'full',
        reason: '',
        attachment: null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/leaves');
    };

    const selectedLeaveType = leaveTypes.find(t => t.id === parseInt(data.leave_type_id));
    const selectedBalance = leaveBalances.find(b => b.leave_type_id === parseInt(data.leave_type_id));

    const today = new Date().toISOString().split('T')[0];
    const minStartDate = selectedLeaveType?.max_backdate_days
        ? new Date(Date.now() - selectedLeaveType.max_backdate_days * 86400000).toISOString().split('T')[0]
        : today;

    const isSingleDay = data.start_date && data.end_date && data.start_date === data.end_date;

    // When switching between single/multi day, reset halves to sensible defaults
    const handleStartDateChange = (val) => {
        setData(d => ({
            ...d,
            start_date: val,
            start_half: 'full',
            end_half: 'full',
        }));
    };

    const handleEndDateChange = (val) => {
        setData(d => ({
            ...d,
            end_date: val,
            start_half: 'full',
            end_half: 'full',
        }));
    };

    // Single day: one picker with Full / AM / PM
    // value maps to: full → 'full', AM → 'first_half', PM → 'second_half'
    const singleDayValue = () => {
        if (data.start_half === 'first_half') return 'AM';
        if (data.start_half === 'second_half') return 'PM';
        return 'full';
    };

    const handleSingleDayChange = (val) => {
        if (val === 'full') {
            setData(d => ({ ...d, start_half: 'full', end_half: 'full' }));
        } else if (val === 'AM') {
            setData(d => ({ ...d, start_half: 'first_half', end_half: 'first_half' }));
        } else {
            setData(d => ({ ...d, start_half: 'second_half', end_half: 'second_half' }));
        }
    };

    return (
        <AuthenticatedLayout title="Apply for Leave">
            <Head title="Apply for Leave" />

            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg">
                    <div className="p-6 space-y-6">
                        {/* Leave Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Leave Type
                            </label>
                            <select
                                value={data.leave_type_id}
                                onChange={(e) => setData('leave_type_id', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                            {selectedBalance && (
                                <p className="mt-1 text-sm text-gray-500">
                                    Available: {selectedBalance.entitled_days + selectedBalance.carried_over + selectedBalance.adjustment - selectedBalance.used_days - selectedBalance.pending_days} days
                                </p>
                            )}
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) => handleStartDateChange(e.target.value)}
                                    min={minStartDate}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                {errors.start_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={data.end_date}
                                    onChange={(e) => handleEndDateChange(e.target.value)}
                                    min={data.start_date || minStartDate}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                {errors.end_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                                )}
                            </div>
                        </div>

                        {/* Half Day Options — only shown once dates are selected */}
                        {selectedLeaveType?.allows_half_day && data.start_date && data.end_date && (
                            isSingleDay ? (
                                /* Single day: one simple picker */
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Duration
                                    </label>
                                    <select
                                        value={singleDayValue()}
                                        onChange={(e) => handleSingleDayChange(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="full">Full Day</option>
                                        <option value="AM">Half Day — Morning (AM)</option>
                                        <option value="PM">Half Day — Afternoon (PM)</option>
                                    </select>
                                </div>
                            ) : (
                                /* Multi-day: start can be PM, end can be AM */
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            First Day
                                        </label>
                                        <select
                                            value={data.start_half === 'second_half' ? 'second_half' : 'full'}
                                            onChange={(e) => setData('start_half', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="full">Full Day</option>
                                            <option value="second_half">Half Day — Afternoon (PM)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Last Day
                                        </label>
                                        <select
                                            value={data.end_half === 'first_half' ? 'first_half' : 'full'}
                                            onChange={(e) => setData('end_half', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="full">Full Day</option>
                                            <option value="first_half">Half Day — Morning (AM)</option>
                                        </select>
                                    </div>
                                </div>
                            )
                        )}

                        {/* Reason */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Reason
                            </label>
                            <textarea
                                value={data.reason}
                                onChange={(e) => setData('reason', e.target.value)}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder="Enter reason for leave (optional)"
                            />
                            {errors.reason && (
                                <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
                            )}
                        </div>

                        {/* Attachment */}
                        {selectedLeaveType?.requires_attachment && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Attachment (Required)
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) => setData('attachment', e.target.files[0])}
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                                {errors.attachment && (
                                    <p className="mt-1 text-sm text-red-600">{errors.attachment}</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                        <a
                            href="/leaves"
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Cancel
                        </a>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {processing ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
