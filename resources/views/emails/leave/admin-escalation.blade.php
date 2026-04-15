<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Leave Approval Escalation</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 22px;">Action Required: Unresolved Leave Request</h1>
    </div>
    <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Dear {{ $admin->name }},</p>
        <p>The following leave request has been <strong>pending for {{ $daysPending }} day(s)</strong>. A reminder was already sent to the assigned supervisor/mentor, but no action has been taken yet.</p>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; margin: 16px 0;">
            <p style="margin: 0; font-weight: bold; color: #dc2626;">This request requires administrator attention.</p>
        </div>

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
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{ \Carbon\Carbon::parse($leaveRequest->start_date)->format('d M Y') }}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">End Date:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{ \Carbon\Carbon::parse($leaveRequest->end_date)->format('d M Y') }}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Total Days:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{ $leaveRequest->total_days }} day(s)</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Submitted:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{ $leaveRequest->created_at->format('d M Y H:i') }}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Reminder Sent:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{{ $leaveRequest->reminder_sent_at ? $leaveRequest->reminder_sent_at->format('d M Y H:i') : 'N/A' }}</td>
            </tr>
        </table>

        <p>Please log in to the system to review and take action on this leave request.</p>
        <p style="color: #6b7280; font-size: 14px;">This is an automated message from {{ \App\Models\SystemSetting::getCompanyName() }}.</p>
    </div>
</body>
</html>
