import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Download, RotateCcw, Trash2, AlertTriangle, Archive } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

const FIELD_LABELS = {
    entitled_days: 'Entitled Days',
    carried_over: 'Carried Over',
    adjustment: 'Adjustment',
};

function summariseSettings(s) {
    if (!s) return '—';
    const verb = s.adjustment_type === 'add'
        ? (s.adjustment_value >= 0 ? `+${s.adjustment_value}` : `${s.adjustment_value}`)
        : `= ${s.adjustment_value}`;
    const parts = [`${FIELD_LABELS[s.field] || s.field} ${verb}`, `on ${s.leave_type_name || s.leave_type_code}`];
    if (s.financial_year) parts.push(`FY ${s.financial_year}`);
    return parts.join(' · ');
}

function summariseFilters(s) {
    if (!s?.filters) return 'All employees';
    const f = s.filters;
    const bits = [];
    if (f.role) bits.push(`role=${f.role}`);
    if (f.position) bits.push(`position~"${f.position}"`);
    if (f.department_name) bits.push(`dept=${f.department_name}`);
    if (f.employee_type_name) bits.push(`type=${f.employee_type_name}`);
    return bits.length ? bits.join(' · ') : 'All employees';
}

export default function BulkAdjustBackupsIndex({ backups, superAdmins = [] }) {
    const { auth } = usePage().props;
    const isSuperAdmin = auth?.user?.role === 'super_admin';
    const superAdminTooltip = superAdmins.length
        ? superAdmins.map(u => `${u.name} <${u.email}>`).join('\n')
        : 'No active super admin found.';
    const [restoringId, setRestoringId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const confirmRestore = (backup) => {
        const msg = `Restore the entire database from "${backup.filename}"?\n\nThis will overwrite the current database. A safety snapshot of the CURRENT database will be created first so you can roll back.\n\nYou will be logged out after the restore.`;
        if (!window.confirm(msg)) return;
        setRestoringId(backup.id);
        router.post(`/bulk-adjust-backups/${backup.id}/restore`, {}, {
            onFinish: () => setRestoringId(null),
        });
    };

    const confirmDelete = (backup) => {
        if (!window.confirm(`Delete backup "${backup.filename}" permanently?`)) return;
        setDeletingId(backup.id);
        router.delete(`/bulk-adjust-backups/${backup.id}`, {
            onFinish: () => setDeletingId(null),
        });
    };

    return (
        <AuthenticatedLayout title="Bulk Adjustment Backups">
            <Head title="Bulk Adjustment Backups" />

            <div className="max-w-7xl mx-auto space-y-4">
                <div className="bg-white shadow rounded-lg p-4 flex items-start gap-3">
                    <Archive className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700">
                        A database snapshot is taken automatically <strong>before every bulk leave adjustment</strong>. Use this page to download a snapshot for inspection{isSuperAdmin ? ' or restore one if an adjustment caused unintended changes' : ''}.
                        {!isSuperAdmin && (
                            <div className="mt-1 text-sm text-amber-700">
                                If you need to restore a snapshot, please request a{' '}
                                <span
                                    className="underline decoration-dotted cursor-help"
                                    title={superAdminTooltip}
                                >
                                    super admin
                                </span>
                                .
                            </div>
                        )}
                        <div className="mt-1 text-xs text-gray-500">Snapshots are stored separately from the daily backup folder and are automatically deleted after 48 hours.</div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">When</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed by</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adjustment</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filters</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affected</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {backups.data.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">No backups yet. A snapshot will be created the next time a bulk leave adjustment is run.</td></tr>
                            ) : backups.data.map(b => (
                                <tr key={b.id} className={b.restored_at ? 'bg-amber-50/50' : ''}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        <div>{formatDateTime(b.performed_at)}</div>
                                        <div className="text-xs text-gray-400 font-mono truncate max-w-[260px]" title={b.filename}>{b.filename}</div>
                                        {b.restored_at && (
                                            <div className="mt-1 text-xs text-amber-700 flex items-center gap-1">
                                                <RotateCcw className="h-3 w-3" /> Restored {formatDateTime(b.restored_at)}{b.restored_by_name ? ` by ${b.restored_by_name}` : ''}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        <div>{b.performed_by_name || '—'}</div>
                                        {b.performed_by_email && <div className="text-xs text-gray-400">{b.performed_by_email}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                                        {summariseSettings(b.settings)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                                        {summariseFilters(b.settings)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{b.affected_count ?? '—'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                        <div>{b.file_size_human}</div>
                                        {!b.file_exists && (
                                            <div className="mt-1 inline-flex items-center gap-1 text-xs text-red-600">
                                                <AlertTriangle className="h-3 w-3" /> file missing
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                                        <div className="inline-flex items-center gap-2">
                                            <a
                                                href={`/bulk-adjust-backups/${b.id}/download`}
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 ${!b.file_exists ? 'opacity-40 pointer-events-none' : ''}`}
                                                title="Download .sqlite"
                                            >
                                                <Download className="h-4 w-4" />
                                            </a>
                                            {isSuperAdmin && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => confirmRestore(b)}
                                                        disabled={!b.file_exists || restoringId === b.id}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 disabled:opacity-40"
                                                        title="Restore database from this backup"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                        {restoringId === b.id ? 'Restoring…' : 'Restore'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => confirmDelete(b)}
                                                        disabled={deletingId === b.id}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-40"
                                                        title="Delete backup"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {backups.last_page > 1 && (
                        <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-500 flex justify-between items-center">
                            <span>Showing {backups.from}–{backups.to} of {backups.total}</span>
                            <div className="flex gap-1">
                                {backups.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        preserveScroll
                                        className={`px-3 py-1 text-sm rounded border ${link.active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'} ${!link.url ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
