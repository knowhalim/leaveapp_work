<?php
namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\SystemSetting;
use App\Services\GoogleDriveService;
use Google\Service\Oauth2;
use Illuminate\Http\Request;

class GoogleDriveController extends Controller
{
    public function redirect()
    {
        $service = new GoogleDriveService();
        return redirect($service->getAuthUrl());
    }

    public function callback(Request $request)
    {
        if ($request->has('error')) {
            return redirect('/settings/scheduled-tasks')->with('error', 'Google Drive authorization was denied.');
        }

        $service = new GoogleDriveService();
        $token = $service->exchangeCode($request->get('code'));

        if (isset($token['error'])) {
            return redirect('/settings/scheduled-tasks')->with('error', 'Failed to connect Google Drive: ' . $token['error']);
        }

        // Get connected email using the oauth2 service
        try {
            $client = new \Google\Client();
            $client->setClientId(SystemSetting::get('google_client_id', ''));
            $client->setClientSecret(SystemSetting::get('google_client_secret', ''));
            $client->setAccessToken($token);
            $oauth2 = new Oauth2($client);
            $userInfo = $oauth2->userinfo->get();
            $email = $userInfo->getEmail();
        } catch (\Exception $e) {
            $email = 'Connected';
        }

        SystemSetting::set('google_refresh_token', $token['refresh_token'] ?? '', 'string', 'google');
        SystemSetting::set('google_drive_connected_email', $email, 'string', 'google');

        ActivityLog::log('settings.google_drive_connected', null, ['email' => $email]);

        return redirect('/settings/scheduled-tasks')->with('success', "Google Drive connected as {$email}.");
    }

    public function disconnect()
    {
        SystemSetting::set('google_refresh_token', '', 'string', 'google');
        SystemSetting::set('google_drive_connected_email', '', 'string', 'google');

        ActivityLog::log('settings.google_drive_disconnected', null);

        return back()->with('success', 'Google Drive disconnected.');
    }
}
