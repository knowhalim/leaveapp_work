<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your role has been updated - {{ \App\Models\SystemSetting::getCompanyName() }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Your Role Has Been Updated</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Dear {{ $user->name }},</p>

        <p>
            Your role on {{ \App\Models\SystemSetting::getCompanyName() }} has been updated by
            <strong>{{ $changedByName }}</strong>.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: white; border-radius: 6px;">
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 40%;">Previous role:</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">{{ $oldRoleLabel }}</td>
            </tr>
            <tr>
                <td style="padding: 12px; font-weight: bold;">New role:</td>
                <td style="padding: 12px;">{{ $newRoleLabel }}</td>
            </tr>
        </table>

        @if(!empty($onboardingHtml))
        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #2563eb;">Getting Started as {{ $newRoleLabel }}</h2>
            {!! $onboardingHtml !!}
        </div>
        @endif

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $loginUrl ?? url('/login') }}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Go to {{ \App\Models\SystemSetting::getCompanyName() }}
            </a>
        </div>

        <p style="color: #6b7280; font-size: 14px;">If you weren't expecting this change, please contact your administrator.</p>
        <p style="color: #6b7280; font-size: 14px;">This is an automated message from {{ \App\Models\SystemSetting::getCompanyName() }}.</p>
    </div>
</body>
</html>
