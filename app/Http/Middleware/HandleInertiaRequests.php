<?php

namespace App\Http\Middleware;

use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'company_name' => fn () => SystemSetting::getCompanyName(),
            'password_login_enabled' => fn () => (bool) SystemSetting::get('password_login_enabled', true),
            'role_labels' => fn () => [
                'employee'  => SystemSetting::get('role_label_employee', 'Employee'),
                'manager'   => SystemSetting::get('role_label_manager', 'Manager'),
                'admin'     => SystemSetting::get('role_label_admin', 'Admin'),
                'super_admin' => SystemSetting::get('role_label_super_admin', 'Super Admin'),
            ],
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                    'employee' => $request->user()->employee?->load(['department', 'employeeType']),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'message' => fn () => $request->session()->get('message'),
                'import_errors' => fn () => $request->session()->get('import_errors'),
                'import_success_count' => fn () => $request->session()->get('import_success_count'),
                'magic_link_sent' => fn () => $request->session()->get('magic_link_sent'),
                'api_token' => fn () => $request->session()->get('api_token'),
            ],
        ];
    }
}
