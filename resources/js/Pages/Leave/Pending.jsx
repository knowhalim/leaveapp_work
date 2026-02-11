import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDate } from '@/lib/utils';
import { Eye, Clock } from 'lucide-react';

export default function LeavePending({ pendingRequests }) {
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
        </AuthenticatedLayout>
    );
}
