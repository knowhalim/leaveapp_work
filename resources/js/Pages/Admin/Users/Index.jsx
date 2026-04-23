import { useState, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight, Users, X, Briefcase } from 'lucide-react';

function UpdateSupervisorsModal({ availableSupervisors, initialCheckedIds, onClose, onSubmit, processing }) {
    const { role_labels } = usePage().props;
    const getRoleLabel = (role) => role_labels?.[role] || role?.replace('_', ' ');
    const [checkedIds, setCheckedIds] = useState(initialCheckedIds);
    const [search, setSearch] = useState('');

    const filtered = availableSupervisors.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        (s.department || '').toLowerCase().includes(search.toLowerCase())
    );

    const toggle = (id) => {
        setCheckedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">Update Supervisors</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Check or uncheck supervisors. Changes apply to all selected users.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-5 pt-3">
                    <input
                        type="text"
                        placeholder="Search supervisors..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    />
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
                    {filtered.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">No supervisors found.</p>
                    ) : (
                        filtered.map(sup => (
                            <label
                                key={sup.id}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                                    checkedIds.includes(sup.id) ? 'bg-indigo-50' : 'hover:bg-gray-50'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checkedIds.includes(sup.id)}
                                    onChange={() => toggle(sup.id)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{sup.name}</div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {sup.email}
                                        {sup.department ? ` · ${sup.department}` : ''}
                                        {' · '}
                                        <span className="capitalize">{getRoleLabel(sup.role)}</span>
                                    </div>
                                </div>
                            </label>
                        ))
                    )}
                </div>

                <div className="px-5 py-4 border-t flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(checkedIds)}
                        disabled={processing}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditPositionModal({ onClose, onSubmit, processing }) {
    const [position, setPosition] = useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">Edit Position</h3>
                        <p className="text-xs text-gray-500 mt-0.5">This will overwrite the position for all selected users.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="px-5 py-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Position</label>
                    <input
                        type="text"
                        value={position}
                        onChange={e => setPosition(e.target.value)}
                        placeholder="e.g. AIAP49-B1"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    />
                </div>
                <div className="px-5 py-4 border-t flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(position)}
                        disabled={processing || !position.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function UsersIndex({ users, filters, availableSupervisors, positions }) {
    const { auth, role_labels } = usePage().props;
    const getRoleLabel = (role) => role_labels?.[role] || role?.replace('_', ' ');
    const [selectedIds, setSelectedIds] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showPositionModal, setShowPositionModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [approversModalUser, setApproversModalUser] = useState(null);

    const canModify = (user) => {
        if (auth.user.role !== 'admin') return true;
        if (user.role === 'super_admin') return false;
        if (user.role === 'admin' && user.id !== auth.user.id) return false;
        return true;
    };

    const modifiableUsers = users.data.filter(canModify);
    const allSelected = modifiableUsers.length > 0 && modifiableUsers.every(u => selectedIds.includes(u.id));
    const someSelected = modifiableUsers.some(u => selectedIds.includes(u.id));

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !modifiableUsers.find(u => u.id === id)));
        } else {
            const toAdd = modifiableUsers.map(u => u.id).filter(id => !selectedIds.includes(id));
            setSelectedIds(prev => [...prev, ...toAdd]);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    // Compute pre-checked supervisor IDs: intersection of supervisors across all selected users on this page
    const initialCheckedIds = useMemo(() => {
        const selectedOnPage = users.data.filter(u => selectedIds.includes(u.id));
        if (selectedOnPage.length === 0) return [];

        const sets = selectedOnPage.map(u =>
            (u.employee?.supervisors || []).map(s => s.id)
        );

        // Intersection: only supervisors assigned to ALL selected users are pre-checked
        return sets.reduce((a, b) => a.filter(id => b.includes(id)));
    }, [selectedIds, users.data]);

    const handleSubmit = (supervisorIds) => {
        setProcessing(true);
        router.post('/users/bulk-supervisors', {
            user_ids: selectedIds,
            supervisor_ids: supervisorIds,
        }, {
            onSuccess: () => {
                setSelectedIds([]);
                setShowModal(false);
            },
            onFinish: () => setProcessing(false),
        });
    };

    const handlePositionSubmit = (position) => {
        setProcessing(true);
        router.post('/users/bulk-update-position', {
            user_ids: selectedIds,
            position,
        }, {
            onSuccess: () => {
                setSelectedIds([]);
                setShowPositionModal(false);
            },
            onFinish: () => setProcessing(false),
        });
    };

    const handleBulkDelete = () => {
        if (!confirm(`Send a confirmation email to delete ${selectedIds.length} selected user(s)? You will need to click a link in the email to confirm.`)) return;
        setProcessing(true);
        router.post('/users/bulk-delete-request', {
            user_ids: selectedIds,
        }, {
            onSuccess: () => setSelectedIds([]),
            onFinish: () => setProcessing(false),
        });
    };

    const handleFilterChange = (key, value) => {
        router.get('/users', { ...filters, [key]: value }, { preserveState: true });
    };

    const handleToggleStatus = (user) => {
        if (confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} this user?`)) {
            router.post(`/users/${user.id}/toggle-status`);
        }
    };

    const handleDelete = (user) => {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(`/users/${user.id}`);
        }
    };

    return (
        <AuthenticatedLayout title="User Management">
            <Head title="Users" />

            <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-wrap gap-4">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={filters?.search || ''}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    />
                    <select
                        value={filters?.position || ''}
                        onChange={(e) => handleFilterChange('position', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                        <option value="">All Positions</option>
                        {(positions || []).map((pos) => (
                            <option key={pos} value={pos}>{pos}</option>
                        ))}
                    </select>
                    <select
                        value={filters?.role || 'all'}
                        onChange={(e) => handleFilterChange('role', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                        <option value="all">All Roles</option>
                        <option value="super_admin">{getRoleLabel('super_admin')}</option>
                        <option value="admin">{getRoleLabel('admin')}</option>
                        <option value="manager">{getRoleLabel('manager')}</option>
                        <option value="employee">{getRoleLabel('employee')}</option>
                    </select>
                    <select
                        value={filters?.status || 'all'}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <Link
                    href="/users/create"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4" />
                    Add User
                </Link>
            </div>

            {/* Bulk action bar */}
            {selectedIds.length > 0 && (
                <div className="mb-4 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-medium text-indigo-700">
                        {selectedIds.length} user{selectedIds.length !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        >
                            <Users className="h-4 w-4" />
                            Update Supervisors
                        </button>
                        <button
                            onClick={() => setShowPositionModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700"
                        >
                            <Briefcase className="h-4 w-4" />
                            Edit Position
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 w-10">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                    onChange={toggleSelectAll}
                                    disabled={modifiableUsers.length === 0}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Department
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Position
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Approver
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.data.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            users.data.map((user) => (
                                <tr
                                    key={user.id}
                                    className={selectedIds.includes(user.id) ? 'bg-indigo-50' : undefined}
                                >
                                    <td className="px-4 py-4 w-10">
                                        {canModify(user) ? (
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(user.id)}
                                                onChange={() => toggleSelect(user.id)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        ) : (
                                            <span className="block w-4" />
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                <span className="text-sm font-medium text-indigo-600">
                                                    {user.name?.charAt(0)?.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.employee?.department?.name || 'Not assigned'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.employee?.position || <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {(() => {
                                            const sups = user.employee?.supervisors || [];
                                            if (sups.length === 0) return <span className="text-gray-300">—</span>;
                                            const primary = sups.find((s) => s.pivot?.is_primary) || sups[0];
                                            const name = primary?.user?.name || '—';
                                            if (sups.length > 1) {
                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={() => setApproversModalUser(user)}
                                                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                                                        title="View all approvers"
                                                    >
                                                        {name} +{sups.length - 1}
                                                    </button>
                                                );
                                            }
                                            return <span>{name}</span>;
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/users/${user.id}`}
                                                className="text-gray-600 hover:text-gray-900"
                                                title="View"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                            {canModify(user) && (
                                                <Link
                                                    href={`/users/${user.id}/edit`}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            )}
                                            {canModify(user) && (
                                                <button
                                                    onClick={() => handleToggleStatus(user)}
                                                    className={user.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                                                    title={user.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {user.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                                </button>
                                            )}
                                            {canModify(user) && (
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {users.last_page > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="text-sm text-gray-700">
                            Showing {users.from} to {users.to} of {users.total} results
                        </div>
                        <div className="flex gap-2">
                            {users.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`px-3 py-1 text-sm rounded ${link.active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showModal && (
                <UpdateSupervisorsModal
                    availableSupervisors={availableSupervisors || []}
                    initialCheckedIds={initialCheckedIds}
                    onClose={() => setShowModal(false)}
                    onSubmit={handleSubmit}
                    processing={processing}
                />
            )}

            {showPositionModal && (
                <EditPositionModal
                    onClose={() => setShowPositionModal(false)}
                    onSubmit={handlePositionSubmit}
                    processing={processing}
                />
            )}

            {approversModalUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Approvers for {approversModalUser.name}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {(approversModalUser.employee?.supervisors || []).length} approver(s) assigned
                                </p>
                            </div>
                            <button
                                onClick={() => setApproversModalUser(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
                            {(approversModalUser.employee?.supervisors || []).map((sup) => (
                                <div
                                    key={sup.id}
                                    className="flex items-center gap-3 px-3 py-2 rounded-md bg-gray-50"
                                >
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
                                        <div className="text-xs text-gray-500 truncate">
                                            {sup.user?.email}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="px-5 py-4 border-t flex justify-end">
                            <button
                                onClick={() => setApproversModalUser(null)}
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
