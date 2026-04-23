<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\BulkAdjustmentBackup;
use Carbon\Carbon;
use Illuminate\Console\Command;

class PruneBulkAdjustBackups extends Command
{
    protected $signature = 'app:prune-bulk-adjust-backups {--hours=48 : Retention window in hours} {--dry-run : List what would be deleted without deleting}';

    protected $description = 'Delete bulk-adjustment backup files and records older than the retention window (default 48 hours).';

    public function handle(): int
    {
        $hours = max(1, (int) $this->option('hours'));
        $cutoff = Carbon::now()->subHours($hours);
        $dryRun = (bool) $this->option('dry-run');

        $stale = BulkAdjustmentBackup::where('performed_at', '<', $cutoff)->get();

        if ($stale->isEmpty()) {
            $this->info("No bulk-adjustment backups older than {$hours}h.");
            return self::SUCCESS;
        }

        $this->info(($dryRun ? '[dry-run] ' : '') . "Pruning {$stale->count()} backup(s) older than {$hours}h (before {$cutoff->toDateTimeString()})...");

        $deleted = 0;
        foreach ($stale as $backup) {
            $this->line("  - {$backup->filename} (performed {$backup->performed_at?->toDateTimeString()})");
            if ($dryRun) {
                continue;
            }
            if ($backup->fileExists()) {
                @unlink($backup->fullPath());
            }
            $backup->delete();
            $deleted++;
        }

        if (!$dryRun && $deleted > 0) {
            ActivityLog::log('bulk_adjust_backup.pruned', null, [
                'count' => $deleted,
                'retention_hours' => $hours,
            ]);
        }

        $this->info($dryRun ? "Would delete {$stale->count()} backup(s)." : "Deleted {$deleted} backup(s).");
        return self::SUCCESS;
    }
}
