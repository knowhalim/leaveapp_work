import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDate } from '@/lib/utils';
import { Eye, Clock, Paperclip, X } from 'lucide-react';

export default function LeavePending({ pendingRequests }) {
    const [approversModalRequest, setApproversModalRequest] = useState(null);

    const approverLabel = (request) => {
        const sups = request.employee?.supervisors || [];
        if (sups.length === 0) return { name: '—', extra: 0 };
        const primary = sups.find((s) => s.pivot?.is_primary) || sups[0];
        return { name: primary?.user?.name || '—', extra: sups.length - 1, sups };
    };

    return (
        <AuthenticatedLayout title="Pending Approvals">
            <Head title="Pending Approvals" />

            <div className="bg-white shadow rounded-lg">
                {pendingRequests.data.length === 0 ? (
                    <div className="p-8 text-center">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
                        <p className="text-gray-500">All leave requests have been processed.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {pendingRequests.data.map((request) => (
                            <li key={request.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                <span className="text-sm font-medium text-indigo-600">
                                                    {request.employee?.user?.name?.charAt(0)?.toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {request.employee?.user?.name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {request.employee?.position}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: request.leave_type?.color }}
                                            />
                                            <span className="text-sm text-gray-900">{request.leave_type?.name}</span>
                                            {request.attachment_path && (
                                                <Paperclip className="h-3.5 w-3.5 text-gray-400" title="Has attachment" />
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">{request.total_days} day(s)</p>
                                    </div>
                                    <div className="flex-1 text-center">
                                        <p className="text-sm text-gray-900">
                                            {formatDate(request.start_date)}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            to {formatDate(request.end_date)}
                                        </p>
                                    </div>
                                    <div className="flex-1 text-center">
                                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Approver</p>
                                        {(() => {
                                            const { name, extra } = approverLabel(request);
                                            if (extra > 0) {
                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={() => setApproversModalRequest(request)}
                                                        className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                                                        title="View all approvers"
                                                    >
                                                        {name} +{extra}
                                                    </button>
                                                );
                                            }
                                            return <p className="text-sm text-gray-900">{name}</p>;
                                        })()}
                                    </div>
                                    <div className="flex-shrink-0">
                                        <Link
                                            href={`/leaves/${request.id}`}
                                            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                        >
                                            <Eye className="h-4 w-4" />
                                            Review
                                        </Link>
                                    </div>
                                </div>
                                {request.reason && (
                                    <div className="mt-3 pl-13">
                                        <p className="text-sm text-gray-500 italic">"{request.reason}"</p>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {approversModalRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Approvers for {approversModalRequest.employee?.user?.name}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {(approversModalRequest.employee?.supervisors || []).length} approver(s) assigned
                                </p>
                            </div>
                            <button
                                onClick={() => setApproversModalRequest(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
                            {(approversModalRequest.employee?.supervisors || []).map((sup) => (
                                <div key={sup.id} className="flex items-center gap-3 px-3 py-2 rounded-md bg-gray-50">
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-medium text-indigo-600">
                                            {sup.user?.name?.charAt(0)?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900 truncate">
                                                {sup.user?.name || '—'}
                                            </span>
                                            {sup.pivot?.is_primary && (
                                                <span className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded bg-indigo-100 text-indigo-700">
                                                    Primary
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">{sup.user?.email}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="px-5 py-4 border-t flex justify-end">
                            <button
                                onClick={() => setApproversModalRequest(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
