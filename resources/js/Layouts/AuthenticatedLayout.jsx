import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    Home,
    Users,
    Building2,
    Calendar,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    ChevronDown,
    Webhook,
    ListPlus,
    Mail,
    FileUp,
    User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuthenticatedLayout({ children, title }) {
    const { auth, company_name, role_labels } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const user = auth?.user;
    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
    const isSuperAdmin = user?.role === 'super_admin';
    const isManager = isAdmin || user?.role === 'manager';

    const getRoleLabel = (role) => role_labels?.[role] || role?.replace('_', ' ');

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Home, show: true },
        { name: 'My Leave', href: '/leaves', icon: Calendar, show: true },
        { name: 'My Balances', href: '/my-balances', icon: FileText, show: true },
        { name: 'Pending Approvals', href: '/leaves/pending', icon: Bell, show: isManager },
        { name: 'My Team', href: '/manager/team', icon: Users, show: isManager },
        { name: 'Users', href: '/users', icon: Users, show: isAdmin },
        { name: 'Batch Import', href: '/users/batch-import', icon: FileUp, show: isManager },
        { name: 'Departments', href: '/departments', icon: Building2, show: isAdmin },
        { name: 'Leave Types', href: '/leave-types', icon: Calendar, show: isAdmin },
        { name: 'Bulk Leave Adjustment', href: '/leave-balances/bulk-adjustment', icon: ListPlus, show: isAdmin },
        { name: 'Mass Email', href: '/mass-email', icon: Mail, show: isAdmin },
        { name: 'Reports', href: '/reports', icon: FileText, show: isAdmin },
        { name: 'Settings', href: '/settings', icon: Settings, show: isAdmin },
        { name: 'Webhooks', href: '/webhooks', icon: Webhook, show: isSuperAdmin },
    ].filter(item => item.show);

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile sidebar */}
            <div className={cn(
                'fixed inset-0 z-50 lg:hidden',
                sidebarOpen ? 'block' : 'hidden'
            )}>
                <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
                <div className="fixed inset-y-0 left-0 w-64 bg-white">
                    <div className="flex h-16 items-center justify-between px-6">
                        <span className="text-xl font-semibold text-gray-900">{company_name}</span>
                        <button onClick={() => setSidebarOpen(false)}>
                            <X className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>
                    <nav className="mt-6 px-3">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
                <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
                    <div className="flex h-16 items-center px-6 border-b border-gray-200">
                        <span className="text-xl font-semibold text-gray-900">{company_name}</span>
                    </div>
                    <nav className="flex-1 mt-6 px-3 space-y-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-indigo-600">
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500 truncate capitalize">{getRoleLabel(user?.role)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <div className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
                    <button
                        className="lg:hidden -m-2.5 p-2.5 text-gray-700"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="flex flex-1 justify-end gap-4">
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                            >
                                <span className="hidden sm:block">{user?.name}</span>
                                <ChevronDown className="h-4 w-4" />
                            </button>
                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                                    <Link
                                        href="/profile"
                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <User className="h-4 w-4" />
                                        Profile
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="py-8">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {title && (
                            <h1 className="text-2xl font-semibold text-gray-900 mb-6">{title}</h1>
                        )}
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
