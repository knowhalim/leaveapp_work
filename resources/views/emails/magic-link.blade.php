<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your Login Link</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">{{ \App\Models\SystemSetting::getCompanyName() }}</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Hi {{ $user->name }},</p>

        <p>You requested a magic link to sign in. Click the button below to log in — no password needed.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $loginUrl }}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: bold;">Sign In Now</a>
        </div>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">This link expires in <strong>15 minutes</strong> and can only be used once.</p>
        </div>

        <p style="color: #6b7280; font-size: 14px;">If you didn't request this link, you can safely ignore this email. Your account remains secure.</p>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px; word-break: break-all;">
            Or copy this link: {{ $loginUrl }}
        </p>
    </div>
</body>
</html>
