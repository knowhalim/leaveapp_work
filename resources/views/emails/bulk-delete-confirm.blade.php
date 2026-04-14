<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Confirm Bulk User Deletion</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Confirm User Deletion</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Dear {{ $admin->name }},</p>

        <p>You have requested to permanently delete <strong>{{ $count }} user(s)</strong> from the system. Please review the list below and click the confirmation button to proceed.</p>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-weight: bold; color: #dc2626;">Users to be deleted:</p>
            <table style="width: 100%; border-collapse: collapse;">
                @foreach($usersToDelete as $user)
                <tr>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #fecaca; font-size: 14px;">{{ $user->name }}</td>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #fecaca; font-size: 14px; color: #6b7280;">{{ $user->email }}</td>
                </tr>
                @endforeach
            </table>
        </div>

        <p style="color: #dc2626; font-weight: bold;">This action is irreversible. All data associated with these users will be permanently removed.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $confirmUrl }}"
               style="display: inline-block; background-color: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                Confirm Deletion
            </a>
        </div>

        <p style="color: #6b7280; font-size: 13px;">This link expires in 30 minutes. If you did not request this deletion, you can safely ignore this email.</p>

        <p style="color: #6b7280; font-size: 14px;">This is an automated message from {{ \App\Models\SystemSetting::getCompanyName() }}.</p>
    </div>
</body>
</html>
