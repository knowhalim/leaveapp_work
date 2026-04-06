<?php
namespace App\Services;

use App\Models\SystemSetting;
use Google\Client;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;

class GoogleDriveService
{
    protected Client $client;

    public function __construct()
    {
        $this->client = new Client();
        $this->client->setClientId(SystemSetting::get('google_client_id', ''));
        $this->client->setClientSecret(SystemSetting::get('google_client_secret', ''));
        $this->client->setRedirectUri(url('/settings/google-drive/callback'));
        $this->client->addScope(Drive::DRIVE_FILE);
        $this->client->setAccessType('offline');
        $this->client->setPrompt('consent');
    }

    public function getAuthUrl(): string
    {
        return $this->client->createAuthUrl();
    }

    public function exchangeCode(string $code): array
    {
        $token = $this->client->fetchAccessTokenWithAuthCode($code);
        $this->client->setAccessToken($token);
        return $token;
    }

    public function uploadFile(string $localPath, string $filename): string
    {
        $refreshToken = SystemSetting::get('google_refresh_token', '');
        $this->client->setAccessToken(['access_token' => '', 'refresh_token' => $refreshToken]);

        if ($this->client->isAccessTokenExpired()) {
            $this->client->fetchAccessTokenWithRefreshToken($refreshToken);
        }

        $service = new Drive($this->client);

        $fileMetadata = new DriveFile([
            'name' => $filename,
            'parents' => array_filter([SystemSetting::get('google_drive_folder_id', null)]),
        ]);

        $result = $service->files->create($fileMetadata, [
            'data' => file_get_contents($localPath),
            'mimeType' => 'application/zip',
            'uploadType' => 'multipart',
            'fields' => 'id,name',
        ]);

        return $result->getId();
    }

    protected function authenticate(): void
    {
        $refreshToken = SystemSetting::get('google_refresh_token', '');
        $this->client->setAccessToken(['access_token' => '', 'refresh_token' => $refreshToken]);
        if ($this->client->isAccessTokenExpired()) {
            $this->client->fetchAccessTokenWithRefreshToken($refreshToken);
        }
    }

    public function listBackups(): array
    {
        $this->authenticate();
        $service = new Drive($this->client);

        $folderId = SystemSetting::get('google_drive_folder_id', null);
        $query = "name contains 'backup-' and mimeType='application/zip' and trashed=false";
        if ($folderId) {
            $query .= " and '{$folderId}' in parents";
        }

        $results = $service->files->listFiles([
            'q' => $query,
            'fields' => 'files(id,name,size,createdTime)',
            'orderBy' => 'createdTime desc',
            'pageSize' => 20,
        ]);

        return array_map(fn($file) => [
            'id'         => $file->getId(),
            'name'       => $file->getName(),
            'size'       => $file->getSize() ? round($file->getSize() / 1024 / 1024, 2) . ' MB' : '—',
            'created_at' => $file->getCreatedTime(),
            'source'     => 'google',
        ], $results->getFiles());
    }

    public function downloadToTemp(string $fileId): string
    {
        $this->authenticate();
        $service = new Drive($this->client);

        $response = $service->files->get($fileId, ['alt' => 'media']);
        $tmpPath  = tempnam(sys_get_temp_dir(), 'gdrive_backup_') . '.zip';
        file_put_contents($tmpPath, $response->getBody()->getContents());

        return $tmpPath;
    }

    public function isConnected(): bool
    {
        return !empty(SystemSetting::get('google_refresh_token', ''));
    }
}
