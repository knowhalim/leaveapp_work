<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PublicHoliday extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'date',
        'is_recurring',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'is_recurring' => 'boolean',
        ];
    }

    public function scopeForYear($query, int $year)
    {
        return $query->whereYear('date', $year)
            ->orWhere('is_recurring', true);
    }

    public function scopeBetween($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }
}
