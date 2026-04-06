<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->password) {
            throw ValidationException::withMessages([
                'email' => ['This account has no password set. Please use the magic link option to sign in.'],
            ]);
        }

        if (!Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated. Please contact an administrator.'],
            ]);
        }

        Auth::login($user, $request->boolean('remember'));

        $user->update(['last_login_at' => now()]);

        ActivityLog::log('login', $user);

        $request->session()->regenerate();

        return $this->redirectToDashboard($user);
    }

    public function logout(Request $request)
    {
        ActivityLog::log('logout', $request->user());

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $user->load('employee.department', 'employee.employeeType');

        return response()->json([
            'user' => $user,
        ]);
    }

    protected function redirectToDashboard(User $user)
    {
        return match ($user->role) {
            'super_admin' => redirect()->route('super-admin.dashboard'),
            'admin' => redirect()->route('admin.dashboard'),
            'manager' => redirect()->route('manager.dashboard'),
            default => redirect()->route('employee.dashboard'),
        };
    }

    public function showForgotPassword()
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
        ]);

        // Password reset logic would go here
        // For now, just return a success message

        return back()->with('success', 'If your email exists in our system, you will receive a password reset link.');
    }
}
