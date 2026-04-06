<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $reportTypeLabel }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">{{ $reportTypeLabel }}</h1>
    </div>

    <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Dear {{ $user->name }},</p>

        <p>Your requested report has been generated and is attached to this email as a CSV file.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: white; border-radius: 6px;">
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 40%;">Report Type:</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">{{ $reportTypeLabel }}</td>
            </tr>
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Financial Year:</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">{{ $year }}</td>
            </tr>
            <tr>
                <td style="padding: 12px; font-weight: bold;">Generated At:</td>
                <td style="padding: 12px;">{{ $generatedAt }}</td>
            </tr>
        </table>

        <p style="color: #6b7280; font-size: 14px;">Open the attached CSV file in Excel or any spreadsheet application to view the report.</p>
        <p style="color: #6b7280; font-size: 14px;">This is an automated message from {{ \App\Models\SystemSetting::getCompanyName() }}.</p>
    </div>
</body>
</html>
