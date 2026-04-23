import { useState } from 'react';
import { useForm, Head, usePage } from '@inertiajs/react';
import { Eye, EyeOff, LogIn, Mail, CheckCircle } from 'lucide-react';

export default function Login() {
    const { errors: pageErrors, company_name, password_login_enabled } = usePage().props;
    const passwordLoginEnabled = password_login_enabled !== false;
    const [mode, setMode] = useState(passwordLoginEnabled ? 'password' : 'magic');
    const [showPassword, setShowPassword] = useState(false);

    const passwordForm = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const magicForm = useForm({
        email: '',
    });

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        passwordForm.post('/login');
    };

    const handleMagicSubmit = (e) => {
        e.preventDefault();
        magicForm.post('/magic-link');
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        passwordForm.clearErrors();
        magicForm.clearErrors();
        magicForm.reset();
    };

    const magicLinkSent = usePage().props.flash?.magic_link_sent;

    return (
        <>
            <Head title="Login" />
            <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            {company_name}
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Sign in to your account
                        </p>
                    </div>

                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        {/* Mode tabs (only when password login is enabled) */}
                        {passwordLoginEnabled && (
                            <div className="flex border-b border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => switchMode('password')}
                                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                                        mode === 'password'
                                            ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                                            : 'bg-gray-50 text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Password
                                </button>
                                <button
                                    type="button"
                                    onClick={() => switchMode('magic')}
                                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                                        mode === 'magic'
                                            ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                                            : 'bg-gray-50 text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Magic Link
                                </button>
                            </div>
                        )}

                        {/* Password login */}
                        {passwordLoginEnabled && mode === 'password' && (
                            <form className="p-8 space-y-6" onSubmit={handlePasswordSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                            Email address
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={passwordForm.data.email}
                                            onChange={(e) => passwordForm.setData('email', e.target.value)}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            placeholder="you@example.com"
                                        />
                                        {passwordForm.errors.email && (
                                            <p className="mt-1 text-sm text-red-600">{passwordForm.errors.email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                            Password
                                        </label>
                                        <div className="relative mt-1">
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                autoComplete="current-password"
                                                required
                                                value={passwordForm.data.password}
                                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
                                                placeholder="Enter your password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <Eye className="h-5 w-5 text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                        {passwordForm.errors.password && (
                                            <p className="mt-1 text-sm text-red-600">{passwordForm.errors.password}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            id="remember"
                                            type="checkbox"
                                            checked={passwordForm.data.remember}
                                            onChange={(e) => passwordForm.setData('remember', e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
                                            Remember me
                                        </label>
                                    </div>

                                    <a href="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                        Forgot password?
                                    </a>
                                </div>

                                <button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <LogIn className="h-5 w-5" />
                                    {passwordForm.processing ? 'Signing in...' : 'Sign in'}
                                </button>
                            </form>
                        )}

                        {/* Magic link */}
                        {(!passwordLoginEnabled || mode === 'magic') && (
                            <div className="p-8">
                                {magicLinkSent ? (
                                    <div className="text-center space-y-4">
                                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                                        <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
                                        <p className="text-sm text-gray-600">
                                            We sent a login link to <strong>{magicLinkSent}</strong>.
                                            It expires in 15 minutes.
                                        </p>
                                        <p className="text-xs text-gray-500">Didn't receive it? Check your spam folder or try again.</p>
                                        <button
                                            type="button"
                                            onClick={() => magicForm.reset()}
                                            className="text-sm text-indigo-600 hover:text-indigo-500"
                                        >
                                            Send another link
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleMagicSubmit} className="space-y-6">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-4">
                                                Enter your email and we'll send you a one-click login link. No password needed.
                                            </p>
                                            <label htmlFor="magic-email" className="block text-sm font-medium text-gray-700">
                                                Email address
                                            </label>
                                            <input
                                                id="magic-email"
                                                type="email"
                                                autoComplete="email"
                                                required
                                                value={magicForm.data.email}
                                                onChange={(e) => magicForm.setData('email', e.target.value)}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                placeholder="you@example.com"
                                            />
                                            {magicForm.errors.email && (
                                                <p className="mt-1 text-sm text-red-600">{magicForm.errors.email}</p>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={magicForm.processing}
                                            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Mail className="h-5 w-5" />
                                            {magicForm.processing ? 'Sending...' : 'Send Magic Link'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="text-center text-sm text-gray-500">
                        <p>{company_name}</p>
                    </div>
                </div>
            </div>
        </>
    );
}
