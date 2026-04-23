<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\BulkAdjustmentBackup;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BulkAdjustmentBackupController extends Controller
{
    public function index()
    {
        $backups = BulkAdjustmentBackup::with(['performedBy:id,name,email', 'restoredBy:id,name,email'])
            ->orderByDesc('performed_at')
            ->paginate(25);

        // Decorate with existence + human-readable file size
        $backups->getCollection()->transform(function (BulkAdjustmentBackup $b) {
            return [
                'id' => $b->id,
                'filename' => $b->filename,
                'performed_by_user_id' => $b->performed_by_user_id,
                'performed_by_name' => $b->performed_by_name ?? $b->performedBy?->name,
                'performed_by_email' => $b->performedBy?->email,
                'performed_at' => $b->performed_at?->toIso8601String(),
                'settings' => $b->settings,
                'affected_count' => $b->affected_count,
                'file_size' => $b->file_size,
                'file_size_human' => $this->humanSize($b->file_size),
                'file_exists' => $b->fileExists(),
                'restored_at' => $b->restored_at?->toIso8601String(),
                'restored_by_name' => $b->restoredBy?->name,
            ];
        });

        $superAdmins = User::where('role', 'super_admin')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['name', 'email'])
            ->map(fn ($u) => ['name' => $u->name, 'email' => $u->email]);

        return Inertia::render('Admin/BulkAdjustBackups/Index', [
            'backups' => $backups,
            'superAdmins' => $superAdmins,
        ]);
    }

    public function download(BulkAdjustmentBackup $backup)
    {
        if (!$backup->fileExists()) {
            return back()->with('error', 'Backup file not found on disk.');
        }

        return response()->streamDownload(function () use ($backup) {
            $fp = fopen($backup->fullPath(), 'rb');
            while (!feof($fp)) {
                echo fread($fp, 8192);
                flush();
            }
            fclose($fp);
        }, $backup->filename, [
            'Content-Type' => 'application/x-sqlite3',
            'Content-Length' => (string) $backup->file_size,
        ]);
    }

    public function restore(Request $request, BulkAdjustmentBackup $backup)
    {
        if (!$backup->fileExists()) {
            return back()->with('error', 'Backup file not found on disk.');
        }

        $connection = config('database.default');
        $driver = config("database.connections.{$connection}.driver");
        if ($driver !== 'sqlite') {
            return back()->with('error', 'Restore is only supported for SQLite databases.');
        }

        $dbPath = config("database.connections.{$connection}.database");
        if (!is_string($dbPath)) {
            return back()->with('error', 'Database path not configured.');
        }

        // Take a safety snapshot of the current DB so the restore itself is reversible.
        $safetyDir = BulkAdjustmentBackup::storageDir();
        if (!is_dir($safetyDir)) {
            @mkdir($safetyDir, 0775, true);
        }
        $safetyName = 'pre-restore_' . Carbon::now()->format('Y-m-d_His') . '_u' . (auth()->id() ?? 0) . '.sqlite';
        @copy($dbPath, $safetyDir . '/' . $safetyName);

        // Disconnect Laravel's pooled connection before overwriting the file on disk.
        \DB::disconnect($connection);

        if (!@copy($backup->fullPath(), $dbPath)) {
            return back()->with('error', 'Failed to write database file. Check permissions.');
        }

        $backup->update([
            'restored_at' => Carbon::now(),
            'restored_by_user_id' => auth()->id(),
        ]);

        ActivityLog::log('bulk_adjust_backup.restored', $backup, [
            'filename' => $backup->filename,
            'safety_snapshot' => $safetyName,
        ]);

        // The current session table was part of the restored DB, so the user may be logged out.
        return redirect('/login')->with('success', "Database restored from {$backup->filename}. A safety snapshot ({$safetyName}) was created first. Please log in again.");
    }

    public function destroy(BulkAdjustmentBackup $backup)
    {
        if ($backup->fileExists()) {
            @unlink($backup->fullPath());
        }
        $filename = $backup->filename;
        $backup->delete();

        ActivityLog::log('bulk_adjust_backup.deleted', null, ['filename' => $filename]);

        return back()->with('success', "Backup {$filename} deleted.");
    }

    private function humanSize(int $bytes): string
    {
        if ($bytes <= 0) {
            return '0 B';
        }
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = min((int) floor(log($bytes, 1024)), count($units) - 1);
        return round($bytes / (1024 ** $i), $i === 0 ? 0 : 2) . ' ' . $units[$i];
    }
}
