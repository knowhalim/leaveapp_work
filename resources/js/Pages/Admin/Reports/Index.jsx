import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FileText, Building2, Users, Calendar } from 'lucide-react';

export default function ReportsIndex() {
    const reports = [
        {
            name: 'Leave Report',
            description: 'View all leave requests with filters for status, type, and date range',
            href: '/reports/leave',
            icon: Calendar,
            color: 'bg-blue-500',
        },
        {
            name: 'Department Report',
            description: 'View leave statistics by department',
            href: '/reports/department',
            icon: Building2,
            color: 'bg-green-500',
        },
        {
            name: 'Employee Report',
            description: 'View individual employee leave balances and usage',
            href: '/reports/employee',
            icon: Users,
            color: 'bg-purple-500',
        },
        {
            name: 'Leave Type Report',
            description: 'View statistics by leave type',
            href: '/reports/leave-type',
            icon: FileText,
            color: 'bg-yellow-500',
        },
    ];

    return (
        <AuthenticatedLayout title="Reports">
            <Head title="Reports" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reports.map((report) => (
                    <Link
                        key={report.name}
                        href={report.href}
                        className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start gap-4">
                            <div className={`${report.color} rounded-lg p-3`}>
                                <report.icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">{report.name}</h3>
                                <p className="mt-1 text-sm text-gray-500">{report.description}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </AuthenticatedLayout>
    );
}
