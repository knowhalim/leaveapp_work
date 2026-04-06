<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class RestoreBackup extends Command
{
    protected $signature = 'app:restore-backup {zipPath : Full path to the backup zip file}';
    protected $description = 'Restore the database and leave attachments from a backup zip file.';

    public function handle(): int
    {
        $zipPath = $this->argument('zipPath');

        if (!file_exists($zipPath)) {
            $this->error("Backup file not found: {$zipPath}");
            return Command::FAILURE;
        }

        $zip = new \ZipArchive();
        if ($zip->open($zipPath) !== true) {
            $this->error('Failed to open zip file.');
            return Command::FAILURE;
        }

        $this->info('Restoring backup...');

        // Restore database
        $dbEntry = 'database/database.sqlite';
        if ($zip->locateName($dbEntry) !== false) {
            $dbDest = database_path('database.sqlite');
            $contents = $zip->getFromName($dbEntry);
            if ($contents === false) {
                $this->error('Could not read database from zip.');
                $zip->close();
                return Command::FAILURE;
            }
            file_put_contents($dbDest, $contents);
            $this->info('✓ Database restored.');
        } else {
            $this->warn('No database found in zip, skipping.');
        }

        // Restore leave attachments
        $attachmentsBase = 'leave-attachments/';
        $attachmentsDest = storage_path('app/public/leave-attachments');

        if (!is_dir($attachmentsDest)) {
            mkdir($attachmentsDest, 0775, true);
        }

        $restoredFiles = 0;
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if (str_starts_with($name, $attachmentsBase) && !str_ends_with($name, '/')) {
                $relative = substr($name, strlen($attachmentsBase));
                $destPath = $attachmentsDest . '/' . $relative;
                $destDir  = dirname($destPath);
                if (!is_dir($destDir)) {
                    mkdir($destDir, 0775, true);
                }
                file_put_contents($destPath, $zip->getFromIndex($i));
                $restoredFiles++;
            }
        }

        if ($restoredFiles > 0) {
            $this->info("✓ {$restoredFiles} attachment(s) restored.");
        }

        $zip->close();
        $this->info('Restore complete.');

        return Command::SUCCESS;
    }
}
