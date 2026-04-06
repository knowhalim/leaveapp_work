<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Monthly Leave Summary Report</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px;">

    <!-- Header -->
    <div style="background-color: #4F46E5; color: white; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 22px; font-weight: bold;">Monthly Leave Summary Report</h1>
        <p style="margin: 6px 0 0 0; font-size: 15px; opacity: 0.9;">{{ $month }}</p>
    </div>

    <!-- Body -->
    <div style="background-color: #f9fafb; padding: 24px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">

        <p style="margin-top: 0;">Dear {{ $admin->name }},</p>
        <p>Here is the leave summary for <strong>{{ $companyName }}</strong> for the month of <strong>{{ $month }}</strong>.</p>

        <!-- Overview Stats -->
        <h2 style="font-size: 16px; color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 6px; margin-top: 24px;">Overview</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 12px 0 20px 0;">
            <thead>
                <tr style="background-color: #4F46E5; color: white;">
                    <th style="padding: 10px 12px; text-align: left; font-weight: bold;">Metric</th>
                    <th style="padding: 10px 12px; text-align: right; font-weight: bold;">Count</th>
                </tr>
            </thead>
            <tbody>
                <tr style="background-color: #ffffff;">
                    <td style="padding: 9px 12px; border-bottom: 1px solid #e5e7eb;">Total Requests</td>
                    <td style="padding: 9px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">{{ $stats['total'] }}</td>
                </tr>
                <tr style="background-color: #f9fafb;">
                    <td style="padding: 9px 12px; border-bottom: 1px solid #e5e7eb;">
                        <span style="display: inline-block; width: 10px; height: 10px; background-color: #059669; border-radius: 50%; margin-right: 6px; vertical-align: middle;"></span>
                        Approved
                    </td>
                    <td style="padding: 9px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #059669; font-weight: bold;">{{ $stats['approved'] }}</td>
                </tr>
                <tr style="background-color: #ffffff;">
                    <td style="padding: 9px 12px; border-bottom: 1px solid #e5e7eb;">
                        <span style="display: inline-block; width: 10px; height: 10px; background-color: #f59e0b; border-radius: 50%; margin-right: 6px; vertical-align: middle;"></span>
                        Pending
                    </td>
                    <td style="padding: 9px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #f59e0b; font-weight: bold;">{{ $stats['pending'] }}</td>
                </tr>
                <tr style="background-color: #f9fafb;">
                    <td style="padding: 9px 12px; border-bottom: 1px solid #e5e7eb;">
                        <span style="display: inline-block; width: 10px; height: 10px; background-color: #ef4444; border-radius: 50%; margin-right: 6px; vertical-align: middle;"></span>
                        Rejected
                    </td>
                    <td style="padding: 9px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #ef4444; font-weight: bold;">{{ $stats['rejected'] }}</td>
                </tr>
                <tr style="background-color: #ffffff;">
                    <td style="padding: 9px 12px;">
                        <span style="display: inline-block; width: 10px; height: 10px; background-color: #6b7280; border-radius: 50%; margin-right: 6px; vertical-align: middle;"></span>
                        Cancelled
                    </td>
                    <td style="padding: 9px 12px; text-align: right; color: #6b7280; font-weight: bold;">{{ $stats['cancelled'] }}</td>
                </tr>
            </tbody>
        </table>

        @if(!empty($stats['by_leave_type']))
        <!-- Breakdown by Leave Type -->
        <h2 style="font-size: 16px; color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 6px; margin-top: 24px;">Breakdown by Leave Type</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 12px 0 20px 0;">
            <thead>
                <tr style="background-color: #4F46E5; color: white;">
                    <th style="padding: 10px 12px; text-align: left; font-weight: bold;">Leave Type</th>
                    <th style="padding: 10px 12px; text-align: right; font-weight: bold;">Requests</th>
                    <th style="padding: 10px 12px; text-align: right; font-weight: bold;">Total Days</th>
                </tr>
            </thead>
            <tbody>
                @foreach($stats['by_leave_type'] as $index => $item)
                <tr style="background-color: {{ $index % 2 === 0 ? '#ffffff' : '#f9fafb' }};">
                    <td style="padding: 9px 12px; border-bottom: 1px solid #e5e7eb;">{{ $item['name'] }}</td>
                    <td style="padding: 9px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">{{ $item['count'] }}</td>
                    <td style="padding: 9px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">{{ $item['days'] }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif

        @if(!empty($stats['by_department']))
        <!-- Breakdown by Department -->
        <h2 style="font-size: 16px; color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 6px; margin-top: 24px;">Breakdown by Department</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 12px 0 20px 0;">
            <thead>
                <tr style="background-color: #4F46E5; color: white;">
                    <th style="padding: 10px 12px; text-align: left; font-weight: bold;">Department</th>
                    <th style="padding: 10px 12px; text-align: right; font-weight: bold;">Requests</th>
                </tr>
            </thead>
            <tbody>
                @foreach($stats['by_department'] as $index => $item)
                <tr style="background-color: {{ $index % 2 === 0 ? '#ffffff' : '#f9fafb' }};">
                    <td style="padding: 9px 12px; border-bottom: 1px solid #e5e7eb;">{{ $item['name'] }}</td>
                    <td style="padding: 9px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">{{ $item['count'] }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif

        <div style="text-align: center; margin: 28px 0 12px 0;">
            <a href="{{ url('/reports') }}" style="background-color: #4F46E5; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Full Reports</a>
        </div>

        <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">This is an automated monthly report from {{ $companyName }}. You are receiving this because you are an administrator.</p>
    </div>

</body>
</html>
