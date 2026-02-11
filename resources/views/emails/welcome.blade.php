<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to HR Leave System</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Welcome to HR Leave System</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Dear {{ $user->name }},</p>

        <p>Your account has been created successfully. Here are your login details:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: white; border-radius: 6px;">
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 40%;">Email:</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">{{ $user->email }}</td>
            </tr>
            @if($temporaryPassword)
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Temporary Password:</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-family: monospace; background-color: #fef3c7;">{{ $temporaryPassword }}</td>
            </tr>
            @endif
            <tr>
                <td style="padding: 12px; font-weight: bold;">Role:</td>
                <td style="padding: 12px;">{{ ucfirst(str_replace('_', ' ', $user->role)) }}</td>
            </tr>
        </table>

        @if($temporaryPassword)
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #92400e;">Important Security Notice</p>
            <p style="margin: 10px 0 0 0; color: #92400e;">Please change your password after your first login for security purposes.</p>
        </div>
        @endif

        {{-- Role-specific onboarding content --}}
        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #2563eb;">Getting Started Guide</h2>

            @if($user->role === 'employee')
                @include('emails.onboarding.employee')
            @elseif($user->role === 'manager')
                @include('emails.onboarding.manager')
            @elseif($user->role === 'admin')
                @include('emails.onboarding.admin')
            @elseif($user->role === 'super_admin')
                @include('emails.onboarding.super-admin')
            @endif
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ url('/login') }}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Login to Your Account</a>
        </div>

        <p style="color: #6b7280; font-size: 14px;">If you have any questions, please contact your HR administrator.</p>
        <p style="color: #6b7280; font-size: 14px;">This is an automated message from the HR Leave System.</p>
    </div>
</body>
</html>
