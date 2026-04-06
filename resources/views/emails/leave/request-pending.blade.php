<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Leave Request Pending Approval</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Leave Request Pending Approval</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Dear {{ $supervisor->user->name ?? $manager->name ?? 'Manager' }},</p>

        <p>A new leave request requires your approval:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 40%;">Employee:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{ $leaveRequest->employee->user->name }}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Leave Type:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{ $leaveRequest->leaveType->name }}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Start Date:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{ \Carbon\Carbon::parse($leaveRequest->start_date)->format('d M Y') }} ({{ ucfirst(str_replace('_', ' ', $leaveRequest->start_half)) }})</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">End Date:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{ \Carbon\Carbon::parse($leaveRequest->end_date)->format('d M Y') }} ({{ ucfirst(str_replace('_', ' ', $leaveRequest->end_half)) }})</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Total Days:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{ $leaveRequest->total_days }} day(s)</td>
            </tr>
            @if($leaveRequest->reason)
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Reason:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{ $leaveRequest->reason }}</td>
            </tr>
            @endif
        </table>

        <p>Please log in to {{ \App\Models\SystemSetting::getCompanyName() }} to review and approve or reject this request.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ url('/leaves/' . $leaveRequest->id) }}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Request</a>
        </div>

        <p style="color: #6b7280; font-size: 14px;">This is an automated message from {{ \App\Models\SystemSetting::getCompanyName() }}.</p>
    </div>
</body>
</html>
