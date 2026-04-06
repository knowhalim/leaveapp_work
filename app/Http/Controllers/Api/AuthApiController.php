<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\MagicLink;
use App\Models\User;
use App\Services\EmailService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AuthApiController extends Controller
{
    /**
     * Send a magic link to the given email address.
     * The email must exist in the system.
     */
    public function sendMagicLink(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
        ], [
            'email.exists' => 'No account found with that email address in the system.',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user->is_active) {
            return response()->json([
                'error' => 'Account has been deactivated. Please contact an administrator.',
            ], 403);
        }

        // Delete any existing unused magic links for this email
        MagicLink::where('email', $request->email)->delete();

        $token = Str::random(64);
        MagicLink::create([
            'email'      => $request->email,
            'token'      => $token,
            'expires_at' => now()->addMinutes(15),
        ]);

        app(EmailService::class)->sendMagicLinkEmail($user, $token);

        return response()->json([
            'message' => 'Magic link sent to your email address. It expires in 15 minutes.',
        ]);
    }

    /**
     * Authenticate using a magic link token.
     * Returns a Sanctum bearer token on success.
     */
    public function authenticate(string $token)
    {
        $magicLink = MagicLink::where('token', $token)->first();

        if (!$magicLink || !$magicLink->isValid()) {
            return response()->json([
                'error' => 'This login link is invalid or has expired. Please request a new one.',
            ], 401);
        }

        $user = User::where('email', $magicLink->email)->first();

        if (!$user || !$user->is_active) {
            return response()->json([
                'error' => 'Account not found or has been deactivated.',
            ], 401);
        }

        $magicLink->update(['used_at' => now()]);
        $user->update(['last_login_at' => now()]);
        ActivityLog::log('api.login.magic_link', $user);

        // Issue a Sanctum token valid for 7 days
        $accessToken = $user->createToken('api-magic-link', ['*'], now()->addDays(7))->plainTextToken;

        return response()->json([
            'message'    => 'Authentication successful.',
            'token'      => $accessToken,
            'token_type' => 'Bearer',
            'expires_in' => 7 * 24 * 60 * 60,
            'user'       => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ]);
    }

    /**
     * Logout: revoke the current API token.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }
}
