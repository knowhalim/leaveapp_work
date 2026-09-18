import { Head, useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plug, Download, KeyRound, Copy, Check, Trash2, ShieldAlert, Wrench, CheckCircle2 } from 'lucide-react';

/**
 * Settings → MCP Server, for admins.
 *
 * Two steps and nothing else. The connection's name, address and tool list are
 * decided by the super admin and shown here only as context, so the whole task
 * is: make a key, download the file.
 */
export default function McpSelfSettings({ connector, endpoint, tools, keys }) {
    const { flash } = usePage().props;
    const [copied, setCopied] = useState(false);

    const keyForm = useForm({ name: '' });

    // Step 2 unlocks once a key exists; before that there is nothing to put in
    // a bundle, and a bundle without one is the thing we are trying to avoid.
    const activeKeys = keys.filter((k) => k.is_active);
    const hasKey = activeKeys.length > 0;
    const newestKey = activeKeys[0];

    const submitKey = (e) => {
        e.preventDefault();
        keyForm.post('/settings/mcp/keys', { preserveScroll: true, onSuccess: () => keyForm.reset() });
    };

    const revoke = (key) => {
        if (!window.confirm(`Revoke "${key.name}"? Any AI client using it stops working immediately.`)) return;
        router.delete(`/settings/mcp/keys/${key.id}`, { preserveScroll: true });
    };

    const copyKey = () => {
        navigator.clipboard.writeText(flash.mcp_key);
        setCopied(true);
        toast.success('Copied');
        setTimeout(() => setCopied(false), 2000);
    };

    const Step = ({ n, done, title, children }) => (
        <div className="flex gap-4">
            <div className="flex flex-col items-center shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    done ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white'
                }`}>
                    {done ? <CheckCircle2 className="w-5 h-5" /> : n}
                </div>
                {n === 1 && <div className="w-px flex-1 bg-gray-200 mt-2" />}
            </div>
            <div className="flex-1 pb-8">
                <h2 className="text-base font-medium text-gray-900 mb-1">{title}</h2>
                {children}
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="MCP Server" />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
                        <Plug className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Connect your AI assistant</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Two steps, then you can ask an AI client for leave reports in plain language.
                            You'll be connecting to <strong>{connector.display_name}</strong>.
                        </p>
                    </div>
                </div>

                {flash?.mcp_key && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="font-medium text-green-900 mb-1">Key created</h3>
                        <p className="text-sm text-green-800 mb-3">
                            You don't need to copy this if you use <strong>Download with key</strong> below — the file
                            already contains it. Copy it only if your client asks you to paste one.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <code className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-xs font-mono break-all">
                                {flash.mcp_key}
                            </code>
                            <button onClick={copyKey} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 shrink-0">
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
                    <Step n={1} done={hasKey} title="Generate your key">
                        {hasKey ? (
                            <p className="text-sm text-gray-600">
                                You have {activeKeys.length === 1 ? 'a key' : `${activeKeys.length} keys`}. Create another
                                if you use a second machine — one key each makes it easy to revoke just the one you lose.
                            </p>
                        ) : (
                            <p className="text-sm text-gray-600 mb-3">
                                The key acts as your own account, with exactly your permissions.
                            </p>
                        )}

                        <form onSubmit={submitKey} className="flex flex-col sm:flex-row gap-2 mt-3">
                            <input
                                type="text"
                                value={keyForm.data.name}
                                onChange={(e) => keyForm.setData('name', e.target.value)}
                                placeholder="What's it for? e.g. My laptop"
                                className="flex-1 rounded-lg border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <button
                                type="submit"
                                disabled={keyForm.processing || !keyForm.data.name}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 shrink-0"
                            >
                                <KeyRound className="w-4 h-4" /> Generate key
                            </button>
                        </form>
                        {keyForm.errors.name && <p className="mt-1 text-sm text-red-600">{keyForm.errors.name}</p>}

                        {hasKey && (
                            <ul className="mt-4 space-y-2">
                                {activeKeys.map((k) => (
                                    <li key={k.id} className="flex items-center justify-between gap-3 text-sm border border-gray-100 rounded-lg px-3 py-2">
                                        <span className="min-w-0">
                                            <span className="font-medium text-gray-900">{k.name}</span>
                                            <span className="block text-xs text-gray-500">
                                                created {k.created_at} · last used {k.last_used_at || 'never'}
                                            </span>
                                        </span>
                                        <button onClick={() => revoke(k)} className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-xs shrink-0">
                                            <Trash2 className="w-3.5 h-3.5" /> Revoke
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Step>

                    <Step n={2} done={false} title="Download the connector file">
                        {!hasKey ? (
                            <p className="text-sm text-gray-500 italic">Generate a key first.</p>
                        ) : (
                            <>
                                <p className="text-sm text-gray-600 mb-3">
                                    Install this <code className="font-mono text-xs">.mcpb</code> file in an
                                    MCP-compatible AI client. Needs Node.js 18+; nothing gets installed.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                                    <a
                                        href={`/settings/mcp/bundle?key=${newestKey.id}`}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                                    >
                                        <Download className="w-4 h-4" /> Download with key (recommended)
                                    </a>
                                    <a
                                        href="/settings/mcp/bundle"
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                                    >
                                        <Download className="w-4 h-4" /> Without key
                                    </a>
                                </div>

                                <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-800">
                                        <strong>Download with key</strong> needs no setup — but the file then contains your
                                        key, so don't email it or put it in shared storage. If it goes astray,
                                        press <strong>Revoke</strong> above and it stops working everywhere at once.
                                        Choosing <strong>Without key</strong> means pasting the key into your client instead.
                                    </p>
                                </div>
                            </>
                        )}
                    </Step>
                </div>

                <section className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Wrench className="w-5 h-5 text-gray-400" />
                        <h2 className="text-base font-medium text-gray-900">What you'll be able to ask ({tools.length})</h2>
                    </div>
                    <ul className="space-y-2">
                        {tools.map((t) => (
                            <li key={t.name} className="text-sm text-gray-600 border-l-2 border-gray-200 pl-3">
                                <code className="text-xs font-mono text-indigo-700">{t.name}</code>
                                <span className="block text-xs mt-0.5">{t.description}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-xs text-gray-500 mt-4">
                        Connects to <code className="font-mono">{endpoint}</code>. All read-only — nothing here can
                        change leave records.
                    </p>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
