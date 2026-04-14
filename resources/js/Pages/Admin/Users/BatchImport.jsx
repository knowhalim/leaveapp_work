import { useEffect, useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Upload, Download, AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const MAX_FILE_SIZE_MB = 2;
const ALLOWED_EXTENSIONS = ['.csv'];

export default function BatchImport({ availableSupervisors = [], departments = [], employeeTypes = [], leaveTypes = [] }) {
    const { auth, flash } = usePage().props;
    const isAdmin = auth.user.role === 'super_admin' || auth.user.role === 'admin';

    const { data, setData, post, processing, errors, reset } = useForm({
        csv_file: null,
        supervisors: [],
        send_welcome_emails: true,
    });

    const addSupervisor = (supervisorId) => {
        const sup = availableSupervisors.find((s) => s.id === parseInt(supervisorId));
        if (!sup || data.supervisors.some((s) => s.id === sup.id)) return;
        setData('supervisors', [...data.supervisors, { ...sup, is_primary: data.supervisors.length === 0 }]);
    };

    const removeSupervisor = (supervisorId) => {
        const updated = data.supervisors.filter((s) => s.id !== supervisorId);
        if (updated.length > 0 && !updated.some((s) => s.is_primary)) updated[0].is_primary = true;
        setData('supervisors', updated);
    };

    const setPrimarySupervisor = (supervisorId) => {
        setData('supervisors', data.supervisors.map((s) => ({ ...s, is_primary: s.id === supervisorId })));
    };

    const [fileError, setFileError] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFileError('');

        if (!file) {
            setData('csv_file', null);
            return;
        }

        const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            setFileError('Only CSV files are allowed.');
            e.target.value = '';
            setData('csv_file', null);
            return;
        }

        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setFileError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
            e.target.value = '';
            setData('csv_file', null);
            return;
        }

        setData('csv_file', file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (fileError || !data.csv_file) return;

        post('/users/batch-import', {
            forceFormData: true,
            onSuccess: () => {
                reset('csv_file', 'supervisors');
                const fileInput = document.getElementById('csv_file');
                if (fileInput) fileInput.value = '';
            },
        });
    };

    const importErrors = flash?.import_errors || [];
    const successCount = flash?.import_success_count;
    const hasResults = successCount !== null && successCount !== undefined;
    const flashError = flash?.error;

    useEffect(() => {
        if (successCount > 0) {
            toast.success(`${successCount} user${successCount !== 1 ? 's' : ''} imported successfully.`);
        }
    }, [successCount]);

    useEffect(() => {
        if (flashError) {
            toast.error(flashError);
        }
    }, [flashError]);

    return (
        <AuthenticatedLayout title="Batch Import Users">
            <Head title="Batch Import Users" />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header with download button */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Import multiple employees at once by uploading a CSV file.
                    </p>
                    <a
                        href="/users/batch-import/sample-csv"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <Download className="h-4 w-4" />
                        Download Sample CSV
                    </a>
                </div>

                {/* Flash error banner (e.g. missing columns, unreadable file) */}
                {flashError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                        <p className="text-sm font-medium text-red-800">{flashError}</p>
                    </div>
                )}

                {/* Results section */}
                {hasResults && (
                    <div className="space-y-4">
                        {successCount > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-green-800">
                                        {successCount} user{successCount !== 1 ? 's' : ''} imported successfully.
                                    </p>
                                </div>
                            </div>
                        )}

                        {importErrors.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start gap-3 mb-3">
                                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                                    <p className="text-sm font-medium text-red-800">
                                        {importErrors.length} row{importErrors.length !== 1 ? 's' : ''} had errors and were skipped:
                                    </p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-red-200">
                                                <th className="text-left py-2 px-3 font-medium text-red-800">Row</th>
                                                <th className="text-left py-2 px-3 font-medium text-red-800">Error</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importErrors.map((err, idx) => (
                                                <tr key={idx} className="border-b border-red-100 last:border-0">
                                                    <td className="py-2 px-3 text-red-700">{err.row}</td>
                                                    <td className="py-2 px-3 text-red-700">{err.message}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {successCount === 0 && importErrors.length === 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                                <p className="text-sm text-yellow-800">No rows were found in the CSV file.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Instructions card */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                        <Info className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-lg font-medium text-gray-900">CSV Format Instructions</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Required Columns</h4>
                                <ul className="space-y-1 text-gray-600">
                                    <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">name</code> — Full name</li>
                                    <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">email</code> — Unique email address</li>
                                    <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">employee_number</code> — Unique employee ID</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Optional Columns</h4>
                                <ul className="space-y-1 text-gray-600">
                                    <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">nric</code> — National ID</li>
                                    <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">department</code> — Must match existing name</li>
                                    <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">employee_type</code> — Must match existing name</li>
                                    <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">position</code> — Job title</li>
                                    <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">hire_date</code> — Format: YYYY-MM-DD</li>
                                    <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">phone</code> — Phone number</li>
                                </ul>
                            </div>
                        </div>

                        {leaveTypes.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                                You can also include{' '}
                                <a href="#leave-balance-ref" className="text-indigo-600 hover:underline font-medium">
                                    leave balance columns
                                </a>
                                {' '}(optional) to set custom entitled days per employee.
                            </div>
                        )}
                        {departments.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                                <strong>Available departments:</strong> {departments.join(', ')}
                            </div>
                        )}
                        {employeeTypes.length > 0 && (
                            <div className="mt-1 text-sm text-gray-500">
                                <strong>Available employee types:</strong> {employeeTypes.join(', ')}
                            </div>
                        )}
                        <p className="mt-3 text-sm text-gray-500">
                            Passwords are auto-generated for each user. All imported users are assigned the <strong>employee</strong> role.
                            Rows with errors are skipped — valid rows in the same file are still imported.
                        </p>
                    </div>
                </div>

                {/* Import form */}
                <form onSubmit={handleSubmit}>
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                            <Upload className="h-5 w-5 text-indigo-600" />
                            <h3 className="text-lg font-medium text-gray-900">Upload CSV</h3>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* File input */}
                            <div>
                                <label htmlFor="csv_file" className="block text-sm font-medium text-gray-700">
                                    CSV File <span className="text-gray-400 font-normal">(max {MAX_FILE_SIZE_MB}MB)</span>
                                </label>
                                <input
                                    id="csv_file"
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                                {fileError && <p className="mt-1 text-sm text-red-600">{fileError}</p>}
                                {errors.csv_file && <p className="mt-1 text-sm text-red-600">{errors.csv_file}</p>}
                            </div>

                            {/* Supervisor selection (admin/super_admin only) */}
                            {isAdmin ? (
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Leave Approver(s) / Supervisor(s) <span className="text-red-500">*</span>
                                    </label>

                                    {/* Add supervisor dropdown */}
                                    {availableSupervisors.filter(s => !data.supervisors.some(ds => ds.id === s.id)).length > 0 && (
                                        <select
                                            onChange={(e) => { addSupervisor(e.target.value); e.target.value = ''; }}
                                            defaultValue=""
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="" disabled>Select a supervisor to add...</option>
                                            {availableSupervisors
                                                .filter(s => !data.supervisors.some(ds => ds.id === s.id))
                                                .map((sup) => (
                                                    <option key={sup.id} value={sup.id}>
                                                        {sup.name} — {sup.role.replace('_', ' ')} {sup.department ? `(${sup.department})` : ''}
                                                    </option>
                                                ))}
                                        </select>
                                    )}

                                    {/* Selected supervisors list */}
                                    {data.supervisors.length > 0 ? (
                                        <div className="space-y-2">
                                            {data.supervisors.map((sup) => (
                                                <div key={sup.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-gray-900">{sup.name}</span>
                                                            {sup.is_primary && (
                                                                <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">Primary</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            {sup.role.replace('_', ' ')} {sup.department ? `· ${sup.department}` : ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {!sup.is_primary && (
                                                            <button type="button" onClick={() => setPrimarySupervisor(sup.id)}
                                                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                                                Set Primary
                                                            </button>
                                                        )}
                                                        <button type="button" onClick={() => removeSupervisor(sup.id)}
                                                            className="text-xs text-red-600 hover:text-red-800 font-medium">
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">No supervisors selected. At least one is required.</p>
                                    )}
                                    {errors.supervisors && <p className="mt-1 text-sm text-red-600">{errors.supervisors}</p>}
                                </div>
                            ) : (
                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 flex items-center gap-2">
                                    <Info className="h-4 w-4 text-indigo-600 shrink-0" />
                                    <p className="text-sm text-indigo-700">
                                        You will be automatically assigned as the leave approver for all imported employees.
                                    </p>
                                </div>
                            )}

                            {/* Welcome email checkbox */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="send_welcome_emails"
                                    checked={data.send_welcome_emails}
                                    onChange={(e) => setData('send_welcome_emails', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="send_welcome_emails" className="ml-2 block text-sm text-gray-700">
                                    Send welcome emails with login credentials
                                </label>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end gap-3">
                            <a
                                href="/users"
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancel
                            </a>
                            <button
                                type="submit"
                                disabled={processing || !data.csv_file || !!fileError || (isAdmin && data.supervisors.length === 0)}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                            >
                                <Upload className="h-4 w-4" />
                                {processing ? 'Importing...' : 'Import Users'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Leave balance column reference */}
                {leaveTypes.length > 0 && (
                    <div id="leave-balance-ref" className="bg-white shadow rounded-lg scroll-mt-6">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-medium text-gray-900">Leave Balance Column Reference</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Use these codes as column headers in your CSV to set custom entitled days. Leave blank to use the default.</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-2 pr-6 font-medium text-gray-700 w-28">Column (Code)</th>
                                            <th className="text-left py-2 pr-6 font-medium text-gray-700">Leave Type</th>
                                            <th className="text-left py-2 font-medium text-gray-700">Default Days</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {leaveTypes.map(lt => (
                                            <tr key={lt.code} className="hover:bg-gray-50">
                                                <td className="py-2 pr-6">
                                                    <code className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-mono">{lt.code}</code>
                                                </td>
                                                <td className="py-2 pr-6 text-gray-600">{lt.name}</td>
                                                <td className="py-2 text-gray-500">{lt.default_days}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-4 text-xs text-gray-400">Values must be numeric. Blank or omitted = use the leave type default. Non-numeric values are ignored.</p>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
