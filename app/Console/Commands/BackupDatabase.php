<?php

namespace App\Console\Commands;

use App\Models\SystemSetting;
use Carbon\Carbon;
use Illuminate\Console\Command;

class BackupDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:backup-database {--force : Run even if backup is disabled in settings}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a zipped backup of the database and leave attachments.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $enabled = (bool) SystemSetting::get('cron_backup_enabled', false);

        if (!$enabled && !$this->option('force')) {
            $this->info('Database backup is disabled. Skipping.');
            return Command::SUCCESS;
        }

        $retentionDays = (int) SystemSetting::get('cron_backup_retention_days', 30);

        // Ensure backup directory exists
        $backupDir = storage_path('app/backups');
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0775, true);
        }

        // Build filename
        $timestamp  = Carbon::now()->format('Y-m-d-H-i-s');
        $filename   = "backup-{$timestamp}.zip";
        $zipPath    = $backupDir . '/' . $filename;

        $zip = new \ZipArchive();

        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            $this->error("Failed to create zip file at: {$zipPath}");
            return Command::FAILURE;
        }

        // Add database file
        $dbPath = database_path('database.sqlite');
        if (file_exists($dbPath)) {
            $zip->addFile($dbPath, 'database/database.sqlite');
        } else {
            $this->warn('Database file not found, skipping: ' . $dbPath);
        }

        // Add leave attachments recursively
        $attachmentsDir = storage_path('app/public/leave-attachments');
        if (is_dir($attachmentsDir)) {
            $this->addDirectoryToZip($zip, $attachmentsDir, 'leave-attachments');
        }

        $zip->close();

        $this->info("Backup created: {$filename}");

        // Upload to Google Drive if enabled
        if ((bool) SystemSetting::get('google_drive_enabled', false) && !empty(SystemSetting::get('google_refresh_token', ''))) {
            try {
                $driveService = new \App\Services\GoogleDriveService();
                $fileId = $driveService->uploadFile($zipPath, $filename);
                $this->info("Uploaded to Google Drive: {$fileId}");
            } catch (\Exception $e) {
                $this->error('Google Drive upload failed: ' . $e->getMessage());
            }
        }

        // Delete old backups beyond retention period
        $this->pruneOldBackups($backupDir, $retentionDays);

        return Command::SUCCESS;
    }

    /**
     * Recursively add a directory's contents to a ZipArchive.
     */
    protected function addDirectoryToZip(\ZipArchive $zip, string $dirPath, string $zipBasePath): void
    {
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dirPath, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $absolutePath = $file->getRealPath();
                $relativePath = $zipBasePath . '/' . ltrim(
                    str_replace($dirPath, '', $absolutePath),
                    DIRECTORY_SEPARATOR
                );
                $zip->addFile($absolutePath, $relativePath);
            }
        }
    }

    /**
     * Delete backup zip files older than the retention period.
     */
    protected function pruneOldBackups(string $backupDir, int $retentionDays): void
    {
        $files = glob($backupDir . '/backup-*.zip');

        if (!$files) {
            return;
        }

        $cutoff = Carbon::now()->subDays($retentionDays)->timestamp;

        foreach ($files as $file) {
            if (filemtime($file) < $cutoff) {
                unlink($file);
                $this->info('Deleted old backup: ' . basename($file));
            }
        }
    }
}
