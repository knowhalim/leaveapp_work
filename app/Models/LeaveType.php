<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaveType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'color',
        'default_days',
        'max_days',
        'is_paid',
        'requires_attachment',
        'allows_half_day',
        'is_active',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'is_paid' => 'boolean',
            'requires_attachment' => 'boolean',
            'allows_half_day' => 'boolean',
            'is_active' => 'boolean',
            'settings' => 'array',
        ];
    }

    public function allowances(): HasMany
    {
        return $this->hasMany(LeaveTypeAllowance::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function leaveBalances(): HasMany
    {
        return $this->hasMany(EmployeeLeaveBalance::class);
    }

    public function getAllowanceForEmployeeType(?int $employeeTypeId): ?float
    {
        if ($employeeTypeId === null) {
            return $this->default_days;
        }
        $allowance = $this->allowances()->where('employee_type_id', $employeeTypeId)->first();
        return $allowance?->days_allowed ?? $this->default_days;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
