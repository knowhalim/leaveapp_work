<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeLeaveBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'financial_year',
        'entitled_days',
        'carried_over',
        'adjustment',
        'used_days',
        'pending_days',
    ];

    protected function casts(): array
    {
        return [
            'entitled_days' => 'float',
            'carried_over' => 'float',
            'adjustment' => 'float',
            'used_days' => 'float',
            'pending_days' => 'float',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function getTotalEntitledAttribute(): float
    {
        return $this->entitled_days + $this->carried_over + $this->adjustment;
    }

    public function getAvailableBalanceAttribute(): float
    {
        return $this->total_entitled - $this->used_days - $this->pending_days;
    }

    public function getRemainingBalanceAttribute(): float
    {
        return $this->total_entitled - $this->used_days;
    }
}
