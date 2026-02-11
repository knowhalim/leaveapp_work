<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'department_id',
        'employee_type_id',
        'employee_number',
        'nric',
        'position',
        'hire_date',
        'termination_date',
        'phone',
        'address',
        'date_of_birth',
        'gender',
        'emergency_contact_name',
        'emergency_contact_phone',
    ];

    protected function casts(): array
    {
        return [
            'hire_date' => 'date',
            'termination_date' => 'date',
            'date_of_birth' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function employeeType(): BelongsTo
    {
        return $this->belongsTo(EmployeeType::class);
    }

    public function supervisors(): BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'employee_supervisors', 'employee_id', 'supervisor_id')
            ->withPivot('is_primary')
            ->withTimestamps();
    }

    public function subordinates(): BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'employee_supervisors', 'supervisor_id', 'employee_id')
            ->withPivot('is_primary')
            ->withTimestamps();
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function leaveBalances(): HasMany
    {
        return $this->hasMany(EmployeeLeaveBalance::class);
    }

    public function primarySupervisor()
    {
        return $this->supervisors()->wherePivot('is_primary', true)->first();
    }

    public function getFullNameAttribute(): string
    {
        return $this->user->name;
    }

    public function scopeActive($query)
    {
        return $query->whereHas('user', fn ($q) => $q->where('is_active', true));
    }
}
