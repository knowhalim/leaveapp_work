<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveTypeAllowance extends Model
{
    use HasFactory;

    protected $fillable = [
        'leave_type_id',
        'employee_type_id',
        'days_allowed',
    ];

    protected function casts(): array
    {
        return [
            'days_allowed' => 'float',
        ];
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function employeeType(): BelongsTo
    {
        return $this->belongsTo(EmployeeType::class);
    }
}
