<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BulkAdjustmentBackup extends Model
{
    protected $fillable = [
        'filename',
        'performed_by_user_id',
        'performed_by_name',
        'performed_at',
        'settings',
        'affected_count',
        'file_size',
        'restored_at',
        'restored_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'performed_at' => 'datetime',
            'restored_at' => 'datetime',
            'settings' => 'array',
        ];
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by_user_id');
    }

    public function restoredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'restored_by_user_id');
    }

    public static function storageDir(): string
    {
        return storage_path('app/backups/pre-bulk-adjust');
    }

    public function fullPath(): string
    {
        return self::storageDir() . '/' . $this->filename;
    }

    public function fileExists(): bool
    {
        return is_file($this->fullPath());
    }
}
