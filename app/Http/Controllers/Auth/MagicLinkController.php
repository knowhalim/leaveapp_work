<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\MagicLink;
use App\Models\User;
use App\Services\EmailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class MagicLinkController extends Controller
{
    public function send(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
        ], [
            'email.exists' => 'No account found with that email address.',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user->is_active) {
            return back()->withErrors(['email' => 'Your account has been deactivated. Please contact an administrator.']);
        }

        // Delete any existing unused magic links for this email
        MagicLink::where('email', $request->email)->delete();

        $token = Str::random(64);
        MagicLink::create([
            'email' => $request->email,
            'token' => $token,
            'expires_at' => now()->addMinutes(15),
        ]);

        app(EmailService::class)->sendMagicLinkEmail($user, $token);

        return back()->with('magic_link_sent', $request->email);
    }

    public function authenticate(string $token)
    {
        $magicLink = MagicLink::where('token', $token)->first();

        if (!$magicLink || !$magicLink->isValid()) {
            return redirect()->route('login')->withErrors([
                'email' => 'This login link is invalid or has expired. Please request a new one.',
            ]);
        }

        $user = User::where('email', $magicLink->email)->first();

        if (!$user || !$user->is_active) {
            return redirect()->route('login')->withErrors([
                'email' => 'Account not found or has been deactivated.',
            ]);
        }

        $magicLink->update(['used_at' => now()]);

        Auth::login($user);
        $user->update(['last_login_at' => now()]);
        ActivityLog::log('login', $user);
        request()->session()->regenerate();

        return match ($user->role) {
            'super_admin' => redirect()->route('super-admin.dashboard'),
            'admin' => redirect()->route('admin.dashboard'),
            'manager' => redirect()->route('manager.dashboard'),
            default => redirect()->route('employee.dashboard'),
        };
    }
}
