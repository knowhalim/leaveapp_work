import { Head, useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    Plug, Download, KeyRound, Copy, Check, Trash2, AlertCircle,
    ShieldCheck, Terminal, Save, Wrench, ShieldAlert,
} from 'lucide-react';

/**
 * Settings → MCP Server.
 *
 * Three jobs on one screen, in the order somebody actually does them: name the
 * connection, mint a key, download the bundle.
 */
export default function McpSettings({ connector, endpoint, version, app_url_warning, tools, keys }) {
    const { flash } = usePage().props;
    const [copied, setCopied] = useState(null);

    const nameForm = useForm({ connector_name: connector.stored || '' });
    const keyForm = useForm({ name: '', expires_in: '' });

    const copy = (text, what) => {
        navigator.clipboard.writeText(text);
        setCopied(what);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(null), 2000);
    };

    const submitName = (e) => {
        e.preventDefault();
        nameForm.post('/settings/mcp/connector', { preserveScroll: true });
    };

    const submitKey = (e) => {
        e.preventDefault();
        keyForm.post('/settings/mcp/keys', {
            preserveScroll: true,
            onSuccess: () => keyForm.reset(),
        });
    };

    const revoke = (key) => {
        // A revoked key cannot be restored and breaks whatever is using it, so
        // the confirmation names the key rather than asking "are you sure?".
        if (!window.confirm(`Revoke "${key.name}"? Any MCP client using this key stops working immediately.`)) return;
        router.delete(`/settings/mcp/keys/${key.id}`, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="MCP Server" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
                        <Plug className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">MCP Server</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Let an AI client query leave reports directly. Available to admin and super admin accounts only.
                        </p>
                    </div>
                </div>

                {app_url_warning && (
                    <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">{app_url_warning}</p>
                    </div>
                )}

                {flash?.mcp_key && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-5 h-5 text-green-600" />
                            <h3 className="font-medium text-green-900">Your new API key</h3>
                        </div>
                        <p className="text-sm text-green-800 mb-3">
                            Copy it now — it is not stored in readable form and cannot be shown again.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <code className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-xs font-mono break-all">
                                {flash.mcp_key}
                            </code>
                            <button
                                onClick={() => copy(flash.mcp_key, 'key')}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 shrink-0"
                            >
                                {copied === 'key' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                Copy
                            </button>
                        </div>
                    </div>
                )}

                {/* Connection details */}
                <section className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Connection</h2>

                    <dl className="grid sm:grid-cols-2 gap-4 mb-6">
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-gray-500 mb-1">Endpoint</dt>
                            <dd className="flex items-center gap-2">
                                <code className="text-sm font-mono text-gray-900 break-all">{endpoint}</code>
                                <button onClick={() => copy(endpoint, 'url')} className="text-gray-400 hover:text-gray-600 shrink-0">
                                    {copied === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-gray-500 mb-1">Version</dt>
                            <dd className="text-sm font-mono text-gray-900">{version}</dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-gray-500 mb-1">Shows in client as</dt>
                            <dd className="text-sm text-gray-900">{connector.display_name}</dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-gray-500 mb-1">Bundle filename</dt>
                            <dd className="text-sm font-mono text-gray-900">{connector.filename}</dd>
                        </div>
                    </dl>

                    <form onSubmit={submitName} className="border-t border-gray-100 pt-4">
                        <label htmlFor="connector_name" className="block text-sm font-medium text-gray-700 mb-1">
                            Connection name
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            How this connection is identified in the client. Leave blank to use{' '}
                            <code className="font-mono">{connector.default}</code>. Anything unusable is converted, not rejected.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                id="connector_name"
                                type="text"
                                value={nameForm.data.connector_name}
                                onChange={(e) => nameForm.setData('connector_name', e.target.value)}
                                placeholder={connector.default}
                                className="flex-1 rounded-lg border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <button
                                type="submit"
                                disabled={nameForm.processing}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-900 disabled:opacity-50 shrink-0"
                            >
                                <Save className="w-4 h-4" /> Save
                            </button>
                        </div>
                        {nameForm.errors.connector_name && (
                            <p className="mt-1 text-sm text-red-600">{nameForm.errors.connector_name}</p>
                        )}
                    </form>
                </section>

                {/* Bundle download */}
                <section className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Install bundle</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        A <code className="font-mono text-xs">.mcpb</code> file with this server's address, version and
                        tool list baked in. Install it in an MCP-compatible client and paste an API key when asked —
                        there is nothing else to configure. Requires Node.js 18+; no packages are installed.
                    </p>
                    <a
                        href="/settings/mcp/bundle"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                    >
                        <Download className="w-4 h-4" /> Download {connector.filename}
                    </a>
                    <p className="text-xs text-gray-500 mt-3">
                        To skip pasting the key entirely, use <strong>Download with key</strong> next to a key below.
                        That file contains a live credential — see the warning there.
                    </p>
                </section>

                {/* API keys */}
                <section className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-2">API keys</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        A key acts as the account that created it and inherits its permissions exactly. Create one key
                        per person or per machine, so revoking one does not cut off everyone else.
                    </p>

                    <div className="flex gap-3 p-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800">
                            <strong>Download with key</strong> builds a bundle with the credential inside, so there is
                            nothing to paste and nothing to mistype. The file then reads organisation-wide leave data
                            for anyone who opens it — don't email it or put it in shared storage.
                            If one leaks, <strong>Revoke</strong> kills it everywhere immediately: the key is checked on
                            every request, so there is no cached access to wait out.
                        </div>
                    </div>

                    <form onSubmit={submitKey} className="flex flex-col sm:flex-row gap-2 mb-5">
                        <input
                            type="text"
                            value={keyForm.data.name}
                            onChange={(e) => keyForm.setData('name', e.target.value)}
                            placeholder="Key name, e.g. Halim's laptop"
                            className="flex-1 rounded-lg border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <input
                            type="number"
                            min="1"
                            max="730"
                            value={keyForm.data.expires_in}
                            onChange={(e) => keyForm.setData('expires_in', e.target.value)}
                            placeholder="Expires (days)"
                            className="w-full sm:w-40 rounded-lg border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            disabled={keyForm.processing || !keyForm.data.name}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 shrink-0"
                        >
                            <KeyRound className="w-4 h-4" /> Generate
                        </button>
                    </form>
                    {keyForm.errors.name && <p className="-mt-3 mb-3 text-sm text-red-600">{keyForm.errors.name}</p>}

                    {keys.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No MCP keys yet.</p>
                    ) : (
                        <div className="overflow-x-auto -mx-5 sm:mx-0">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                                        <th className="py-2 px-5 sm:px-3 font-medium">Name</th>
                                        <th className="py-2 px-3 font-medium">Acts as</th>
                                        <th className="py-2 px-3 font-medium">Last used</th>
                                        <th className="py-2 px-3 font-medium">Expires</th>
                                        <th className="py-2 px-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {keys.map((key) => (
                                        <tr key={key.id} className={key.is_active ? '' : 'opacity-50'}>
                                            <td className="py-3 px-5 sm:px-3 font-medium text-gray-900">{key.name}</td>
                                            <td className="py-3 px-3 text-gray-600">
                                                {key.owner ? (
                                                    <>
                                                        {key.owner}
                                                        <span className="block text-xs text-gray-400">{key.owner_role?.replace('_', ' ')}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-amber-600">unbound</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-gray-500 whitespace-nowrap">{key.last_used_at || 'never'}</td>
                                            <td className="py-3 px-3 text-gray-500 whitespace-nowrap">{key.expires_at || '—'}</td>
                                            <td className="py-3 px-3">
                                                <div className="flex items-center justify-end gap-3">
                                                    {key.is_active && (
                                                        <a
                                                            href={`/settings/mcp/bundle?key=${key.id}`}
                                                            title="Bundle with this key baked in — contains a live credential"
                                                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-xs whitespace-nowrap"
                                                        >
                                                            <Download className="w-3.5 h-3.5" /> Download with key
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => revoke(key)}
                                                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-xs"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Revoke
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Tools */}
                <section className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Wrench className="w-5 h-5 text-gray-400" />
                        <h2 className="text-lg font-medium text-gray-900">Tools ({tools.length})</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                        What a connected client can do. This list is generated from the running server, so a downloaded
                        bundle always matches it.
                    </p>
                    <ul className="space-y-3">
                        {tools.map((tool) => (
                            <li key={tool.name} className="border-l-2 border-gray-200 pl-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <code className="text-sm font-mono text-indigo-700">{tool.name}</code>
                                    {tool.read_only && (
                                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">read-only</span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-600 mt-1">{tool.description}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* CLI */}
                <section className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Terminal className="w-5 h-5 text-gray-400" />
                        <h2 className="text-lg font-medium text-gray-900">Build from the command line</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                        For generating a bundle during deployment, or checking what one would contain.
                    </p>
                    <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">
{`php artisan mcp:bundle                    # write the .mcpb
php artisan mcp:bundle --manifest         # print the manifest instead
php artisan mcp:bundle --key=HalimAgent   # bake a key in (contains a credential)`}
                    </pre>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
