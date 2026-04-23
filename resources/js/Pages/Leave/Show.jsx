import { useState } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDate, formatDateTime, getStatusColor } from '@/lib/utils';
import { Check, X, MessageSquare, RefreshCw, AlertTriangle, Users, Calendar, Wallet, Paperclip, Download } from 'lucide-react';

export default function LeaveShow({ leaveRequest, leaveTypes, leaveBalances, leaveTypeBalance, otherPendingLeave, upcomingLeave, teamOnLeave }) {
    const { auth, role_labels } = usePage().props;
    const getRoleLabel = (role) => role_labels?.[role] || role?.replace('_', ' ');
    const user = auth?.user;
    const isManager = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'manager';
    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
    const isOwner = leaveRequest.employee?.user_id === user?.id;
    // Cancellation is reserved for the requester (or admin override). Managers
    // revoke an approved leave via Reject, not Cancel.
    const canCancel = (isOwner || isAdmin) && (leaveRequest.status === 'pending' || leaveRequest.status === 'approved');
    const showManagerCancelNote = isManager && !isAdmin && !isOwner
        && (leaveRequest.status === 'pending' || leaveRequest.status === 'approved');

    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [showAttachmentModal, setShowAttachmentModal] = useState(false);

    const attachmentUrl = leaveRequest.attachment_path ? `/leaves/${leaveRequest.id}/attachment` : null;
    const attachmentExt = (leaveRequest.attachment_path || '').split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(attachmentExt);
    const isPdf = attachmentExt === 'pdf';

    const approveForm = useForm({ notes: '' });
    const rejectForm = useForm({ notes: '' });
    const commentForm = useForm({ comment: '', is_internal: false });
    const convertForm = useForm({ leave_type_id: '', reason: '', attachment: null });

    const handleApprove = (e) => {
        e.preventDefault();
        approveForm.post(`/leaves/${leaveRequest.id}/approve`, {
            onSuccess: () => setShowApproveModal(false),
        });
    };

    const handleReject = (e) => {
        e.preventDefault();
        rejectForm.post(`/leaves/${leaveRequest.id}/reject`, {
            onSuccess: () => setShowRejectModal(false),
        });
    };

    const handleCancel = () => {
        if (confirm('Are you sure you want to cancel this leave request?')) {
            router.post(`/leaves/${leaveRequest.id}/cancel`);
        }
    };

    const handleConvert = (e) => {
        e.preventDefault();
        convertForm.post(`/leaves/${leaveRequest.id}/convert`, {
            onSuccess: () => setShowConvertModal(false),
        });
    };

    const handleComment = (e) => {
        e.preventDefault();
        commentForm.post(`/leaves/${leaveRequest.id}/comment`, {
            onSuccess: () => commentForm.reset(),
        });
    };

    return (
        <AuthenticatedLayout title="Leave Request Details">
            <Head title="Leave Request Details" />

            <div className="max-w-3xl mx-auto space-y-6">
                {/* Leave Details */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Leave Request</h3>
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(leaveRequest.status)}`}>
                            {leaveRequest.status}
                        </span>
                    </div>
                    <div className="p-6">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{getRoleLabel('employee')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{leaveRequest.employee?.user?.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Leave Type</dt>
                                <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                                    <span
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: leaveRequest.leave_type?.color }}
                                    />
                                    {leaveRequest.leave_type?.name}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {formatDate(leaveRequest.start_date)}
                                    {leaveRequest.start_half !== 'full' && ` (${leaveRequest.start_half.replace('_', ' ')})`}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">End Date</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {formatDate(leaveRequest.end_date)}
                                    {leaveRequest.end_half !== 'full' && ` (${leaveRequest.end_half.replace('_', ' ')})`}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Total Days</dt>
                                <dd className="mt-1 text-sm text-gray-900">{leaveRequest.total_days}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Submitted</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatDateTime(leaveRequest.created_at)}</dd>
                            </div>
                            {leaveRequest.reason && (
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Reason</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{leaveRequest.reason}</dd>
                                </div>
                            )}
                            {leaveRequest.attachment_path && (
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Attachment</dt>
                                    <dd className="mt-1 text-sm">
                                        <button
                                            type="button"
                                            onClick={() => setShowAttachmentModal(true)}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 text-indigo-700 hover:bg-indigo-50"
                                        >
                                            <Paperclip className="h-4 w-4" />
                                            View attachment
                                        </button>
                                    </dd>
                                </div>
                            )}
                            {leaveRequest.status !== 'pending' && (
                                <>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Processed By</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{leaveRequest.approver?.name || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Processed At</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{formatDateTime(leaveRequest.approved_at)}</dd>
                                    </div>
                                    {leaveRequest.approval_notes && (
                                        <div className="sm:col-span-2">
                                            <dt className="text-sm font-medium text-gray-500">Notes</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{leaveRequest.approval_notes}</dd>
                                        </div>
                                    )}
                                </>
                            )}
                        </dl>
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-3 items-center">
                        {isManager && leaveRequest.status === 'pending' && (
                            <>
                                <button
                                    onClick={() => setShowApproveModal(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                >
                                    <Check className="h-4 w-4" />
                                    Approve
                                </button>
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                >
                                    <X className="h-4 w-4" />
                                    Reject
                                </button>
                            </>
                        )}
                        {isManager && leaveRequest.status === 'approved' && (
                            <button
                                onClick={() => setShowRejectModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                                title="Revoke this approval"
                            >
                                <X className="h-4 w-4" />
                                Reject
                            </button>
                        )}
                        {leaveRequest.status === 'approved' && (isOwner || isManager) && leaveTypes?.length > 0 && (
                            <button
                                onClick={() => setShowConvertModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Convert Leave Type
                            </button>
                        )}
                        {canCancel && (
                            <button
                                onClick={handleCancel}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancel Request
                            </button>
                        )}
                        {showManagerCancelNote && (
                            <p className="text-xs text-gray-500 ml-auto max-w-sm">
                                Only the requester can cancel their own leave. To revoke an approval, use <span className="font-medium text-red-700">Reject</span>.
                            </p>
                        )}
                    </div>
                </div>

                {/* Approver Context — only shown to managers/admins */}
                {isManager && (
                    <div className="space-y-4">
                        {/* Leave Balance for this type */}
                        {leaveTypeBalance && (
                            <div className="bg-white shadow rounded-lg p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Wallet className="h-4 w-4 text-indigo-500" />
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        {leaveRequest.employee?.user?.name}'s {leaveRequest.leave_type?.name} Balance
                                    </h3>
                                </div>
                                {(() => {
                                    // Exclude this request's own pending days so the approver sees the true effective balance
                                    const thisPending = leaveRequest.status === 'pending' ? leaveRequest.total_days : 0;
                                    const otherPending = Math.max(0, leaveTypeBalance.pending_days - thisPending);
                                    const available = leaveTypeBalance.entitled_days + leaveTypeBalance.carried_over + leaveTypeBalance.adjustment - leaveTypeBalance.used_days - otherPending;
                                    const isLow = available < leaveRequest.total_days;
                                    return (
                                        <>
                                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                                {[
                                                    { label: 'Entitled', value: leaveTypeBalance.entitled_days },
                                                    { label: 'Carried Over', value: leaveTypeBalance.carried_over },
                                                    { label: 'Adjustment', value: leaveTypeBalance.adjustment, signed: true },
                                                    { label: 'Used', value: leaveTypeBalance.used_days, negative: true },
                                                    { label: 'Available', value: available, highlight: true },
                                                ].map(({ label, value, signed, negative, highlight }) => (
                                                    <div key={label} className={`rounded-lg p-3 text-center ${highlight ? (isLow ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200') : 'bg-gray-50'}`}>
                                                        <p className="text-xs text-gray-500 mb-1">{label}</p>
                                                        <p className={`text-lg font-bold ${highlight ? (isLow ? 'text-red-600' : 'text-green-600') : negative ? 'text-gray-700' : 'text-gray-900'}`}>
                                                            {signed && value > 0 ? '+' : ''}{value}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                            {isLow && (
                                                <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
                                                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                                    Insufficient balance — employee has {available} day{available !== 1 ? 's' : ''} available but is requesting {leaveRequest.total_days} day{leaveRequest.total_days !== 1 ? 's' : ''}.
                                                </div>
                                            )}
                                            {otherPending > 0 && (
                                                <p className="mt-2 text-xs text-amber-600">
                                                    Note: {otherPending} day{otherPending !== 1 ? 's' : ''} are held by other pending requests.
                                                </p>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        {/* Other pending + upcoming leave */}
                        {(otherPendingLeave?.length > 0 || upcomingLeave?.length > 0) && (
                            <div className="bg-white shadow rounded-lg p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Calendar className="h-4 w-4 text-indigo-500" />
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        {leaveRequest.employee?.user?.name}'s Other Leave
                                    </h3>
                                </div>

                                {otherPendingLeave?.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">
                                            Other Pending Requests ({otherPendingLeave.length})
                                        </p>
                                        <div className="space-y-2">
                                            {otherPendingLeave.map(l => (
                                                <div key={l.id} className="flex items-center justify-between text-sm bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: l.leave_type?.color }} />
                                                        <span className="font-medium">{l.leave_type?.name}</span>
                                                        <span className="text-gray-500">{formatDate(l.start_date)} – {formatDate(l.end_date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-500">{l.total_days}d</span>
                                                        <Link href={`/leaves/${l.id}`} className="text-indigo-600 hover:text-indigo-800 text-xs">View</Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {upcomingLeave?.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-2">
                                            Upcoming Approved Leave ({upcomingLeave.length})
                                        </p>
                                        <div className="space-y-2">
                                            {upcomingLeave.map(l => (
                                                <div key={l.id} className="flex items-center justify-between text-sm bg-gray-50 border border-gray-100 rounded-md px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: l.leave_type?.color }} />
                                                        <span className="font-medium">{l.leave_type?.name}</span>
                                                        <span className="text-gray-500">{formatDate(l.start_date)} – {formatDate(l.end_date)}</span>
                                                    </div>
                                                    <span className="text-gray-500 text-sm">{l.total_days}d</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Team absences during same period */}
                        {teamOnLeave?.length > 0 && (
                            <div className="bg-white shadow rounded-lg p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Users className="h-4 w-4 text-indigo-500" />
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        Others on Leave During This Period ({teamOnLeave.length})
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {teamOnLeave.map(l => (
                                        <div key={l.id} className="flex items-center justify-between text-sm bg-gray-50 border border-gray-100 rounded-md px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-medium text-indigo-700">
                                                        {l.employee?.user?.name?.charAt(0)?.toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="font-medium">{l.employee?.user?.name}</span>
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.leave_type?.color }} />
                                                <span className="text-gray-500">{l.leave_type?.name}</span>
                                            </div>
                                            <span className="text-gray-500">{formatDate(l.start_date)} – {formatDate(l.end_date)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Comments */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Comments</h3>
                    </div>
                    <div className="p-6">
                        <ul className="space-y-4 mb-6">
                            {leaveRequest.comments?.length === 0 ? (
                                <li className="text-sm text-gray-500">No comments yet</li>
                            ) : (
                                leaveRequest.comments?.map((comment) => (
                                    <li key={comment.id} className="flex gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-medium text-gray-600">
                                                {comment.user?.name?.charAt(0)?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900">{comment.user?.name}</span>
                                                <span className="text-xs text-gray-500">{formatDateTime(comment.created_at)}</span>
                                                {comment.is_internal && (
                                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Internal</span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-gray-700">{comment.comment}</p>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>

                        <form onSubmit={handleComment} className="space-y-4">
                            <textarea
                                value={commentForm.data.comment}
                                onChange={(e) => commentForm.setData('comment', e.target.value)}
                                rows={2}
                                placeholder="Add a comment..."
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                            />
                            <div className="flex justify-between items-center">
                                {isManager && (
                                    <label className="flex items-center gap-2 text-sm text-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={commentForm.data.is_internal}
                                            onChange={(e) => commentForm.setData('is_internal', e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        Internal comment
                                    </label>
                                )}
                                <button
                                    type="submit"
                                    disabled={commentForm.processing || !commentForm.data.comment}
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    Add Comment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Approve Modal */}
            {showApproveModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowApproveModal(false)} />
                        <div className="relative bg-white rounded-lg max-w-md w-full p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Approve Leave Request</h3>
                            <form onSubmit={handleApprove}>
                                <textarea
                                    value={approveForm.data.notes}
                                    onChange={(e) => approveForm.setData('notes', e.target.value)}
                                    rows={3}
                                    placeholder="Add notes (optional)"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm mb-4"
                                />
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowApproveModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={approveForm.processing} className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
                                        Approve
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Convert Modal */}
            {showConvertModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowConvertModal(false)} />
                        <div className="relative bg-white rounded-lg max-w-md w-full p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Convert Leave Type</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Convert this approved leave to a different leave type. The original leave type balance will be restored and the new type balance will be deducted.
                            </p>
                            <form onSubmit={handleConvert} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Leave Type</label>
                                    <select
                                        value={convertForm.data.leave_type_id}
                                        onChange={(e) => convertForm.setData('leave_type_id', e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                        required
                                    >
                                        <option value="">Select leave type</option>
                                        {leaveTypes?.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.name} ({type.code})
                                            </option>
                                        ))}
                                    </select>
                                    {convertForm.errors.leave_type_id && (
                                        <p className="mt-1 text-sm text-red-600">{convertForm.errors.leave_type_id}</p>
                                    )}
                                    {/* Balance indicator */}
                                    {convertForm.data.leave_type_id && (() => {
                                        const selectedId = parseInt(convertForm.data.leave_type_id);
                                        const available = leaveBalances?.[selectedId] ?? null;
                                        const needed = leaveRequest.total_days;
                                        if (available === null) {
                                            return (
                                                <p className="mt-2 text-sm text-amber-600">
                                                    No balance record found for this leave type.
                                                </p>
                                            );
                                        }
                                        if (available <= 0) {
                                            return (
                                                <div className="mt-2 rounded-md bg-red-50 border border-red-200 p-3">
                                                    <p className="text-sm font-medium text-red-700">Insufficient balance</p>
                                                    <p className="text-sm text-red-600 mt-0.5">
                                                        Available: <strong>0 days</strong> — this leave type has no remaining balance. Conversion will result in a negative balance.
                                                    </p>
                                                </div>
                                            );
                                        }
                                        if (available < needed) {
                                            return (
                                                <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 p-3">
                                                    <p className="text-sm font-medium text-amber-700">Insufficient balance</p>
                                                    <p className="text-sm text-amber-600 mt-0.5">
                                                        Available: <strong>{available} day{available !== 1 ? 's' : ''}</strong>, needed: <strong>{needed} day{needed !== 1 ? 's' : ''}</strong>. Conversion will result in a negative balance.
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return (
                                            <p className="mt-2 text-sm text-green-600">
                                                Available balance: <strong>{available} day{available !== 1 ? 's' : ''}</strong> (needs {needed})
                                            </p>
                                        );
                                    })()}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for conversion</label>
                                    <textarea
                                        value={convertForm.data.reason}
                                        onChange={(e) => convertForm.setData('reason', e.target.value)}
                                        rows={3}
                                        placeholder="Explain why the leave type is being changed"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                        required
                                    />
                                    {convertForm.errors.reason && (
                                        <p className="mt-1 text-sm text-red-600">{convertForm.errors.reason}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (optional)</label>
                                    <input
                                        type="file"
                                        onChange={(e) => convertForm.setData('attachment', e.target.files[0])}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    {convertForm.errors.attachment && (
                                        <p className="mt-1 text-sm text-red-600">{convertForm.errors.attachment}</p>
                                    )}
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowConvertModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={convertForm.processing || (() => {
                                            const id = parseInt(convertForm.data.leave_type_id);
                                            return id && leaveBalances?.[id] !== undefined && leaveBalances[id] <= 0;
                                        })()}
                                        className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Convert
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Attachment Modal */}
            {showAttachmentModal && attachmentUrl && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 py-6">
                        <div className="fixed inset-0 bg-gray-900/75" onClick={() => setShowAttachmentModal(false)} />
                        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                            <div className="flex items-center justify-between px-5 py-3 border-b">
                                <div className="flex items-center gap-2">
                                    <Paperclip className="h-4 w-4 text-gray-500" />
                                    <h3 className="text-base font-semibold text-gray-900">Attachment</h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    <a
                                        href={attachmentUrl}
                                        download
                                        className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download
                                    </a>
                                    <button
                                        onClick={() => setShowAttachmentModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto bg-gray-50 p-4 flex items-center justify-center">
                                {isImage ? (
                                    <img src={attachmentUrl} alt="Attachment" className="max-w-full max-h-[75vh] object-contain" />
                                ) : isPdf ? (
                                    <iframe src={attachmentUrl} title="Attachment" className="w-full h-[75vh] bg-white" />
                                ) : (
                                    <div className="text-center py-12">
                                        <Paperclip className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                        <p className="text-sm text-gray-600 mb-4">Preview not available for this file type.</p>
                                        <a
                                            href={attachmentUrl}
                                            download
                                            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download file
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowRejectModal(false)} />
                        <div className="relative bg-white rounded-lg max-w-md w-full p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {leaveRequest.status === 'approved' ? 'Revoke Approved Leave' : 'Reject Leave Request'}
                            </h3>
                            {leaveRequest.status === 'approved' && (
                                <p className="text-xs text-gray-500 mb-3">
                                    This leave is already approved. Rejecting it will return the days to the employee's balance and notify them with your reason.
                                </p>
                            )}
                            <form onSubmit={handleReject}>
                                <textarea
                                    value={rejectForm.data.notes}
                                    onChange={(e) => rejectForm.setData('notes', e.target.value)}
                                    rows={3}
                                    placeholder="Reason for rejection (required)"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm mb-4"
                                    required
                                />
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowRejectModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={rejectForm.processing} className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
                                        Reject
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
