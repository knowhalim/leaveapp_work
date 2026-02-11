<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\LeaveBalanceController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\LeaveTypeController;
use App\Http\Controllers\MassEmailController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WebhookController;
use Illuminate\Support\Facades\Route;

// Redirect root to login
Route::get('/', function () {
    return redirect()->route('login');
});

// Auth routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/forgot-password', [AuthController::class, 'showForgotPassword'])->name('password.request');
    Route::post('/forgot-password', [AuthController::class, 'sendResetLink'])->name('password.email');
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// Protected routes
Route::middleware(['auth', 'active'])->group(function () {
    // Dashboard routes
    Route::get('/super-admin', [DashboardController::class, 'superAdmin'])
        ->name('super-admin.dashboard')
        ->middleware('role:super_admin');

    Route::get('/admin', [DashboardController::class, 'admin'])
        ->name('admin.dashboard')
        ->middleware('role:super_admin,admin');

    Route::get('/manager', [DashboardController::class, 'manager'])
        ->name('manager.dashboard')
        ->middleware('role:super_admin,admin,manager');

    Route::get('/employee', [DashboardController::class, 'employee'])
        ->name('employee.dashboard');

    // Dashboard redirect based on role
    Route::get('/dashboard', function () {
        $user = auth()->user();
        return match ($user->role) {
            'super_admin' => redirect()->route('super-admin.dashboard'),
            'admin' => redirect()->route('admin.dashboard'),
            'manager' => redirect()->route('manager.dashboard'),
            default => redirect()->route('employee.dashboard'),
        };
    })->name('dashboard');

    // Leave routes (all authenticated users)
    Route::prefix('leaves')->name('leaves.')->group(function () {
        Route::get('/', [LeaveController::class, 'index'])->name('index');
        Route::get('/create', [LeaveController::class, 'create'])->name('create');
        Route::post('/', [LeaveController::class, 'store'])->name('store');
        Route::get('/pending', [LeaveController::class, 'pending'])->name('pending')->middleware('role:super_admin,admin,manager');
        Route::get('/{leave}', [LeaveController::class, 'show'])->name('show');
        Route::get('/{leave}/attachment', [LeaveController::class, 'viewAttachment'])->name('attachment');
        Route::post('/{leave}/approve', [LeaveController::class, 'approve'])->name('approve')->middleware('role:super_admin,admin,manager');
        Route::post('/{leave}/reject', [LeaveController::class, 'reject'])->name('reject')->middleware('role:super_admin,admin,manager');
        Route::post('/{leave}/cancel', [LeaveController::class, 'cancel'])->name('cancel');
        Route::post('/{leave}/comment', [LeaveController::class, 'addComment'])->name('comment');
    });

    // My Leave Balances (employees)
    Route::get('/my-balances', [LeaveBalanceController::class, 'myBalances'])->name('my-balances');

    // Admin routes
    Route::middleware('role:super_admin,admin')->group(function () {
        // User management
        Route::resource('users', UserController::class);
        Route::post('/users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle-status');

        // Department management
        Route::resource('departments', DepartmentController::class);
        Route::post('/departments/{department}/toggle-status', [DepartmentController::class, 'toggleStatus'])->name('departments.toggle-status');
        Route::get('/departments/{department}/employees', [DepartmentController::class, 'employees'])->name('departments.employees');

        // Leave Type management
        Route::resource('leave-types', LeaveTypeController::class);
        Route::post('/leave-types/{leaveType}/toggle-status', [LeaveTypeController::class, 'toggleStatus'])->name('leave-types.toggle-status');

        // Leave Balance management
        Route::prefix('leave-balances')->name('leave-balances.')->group(function () {
            Route::get('/', [LeaveBalanceController::class, 'index'])->name('index');
            Route::get('/bulk-adjustment', [LeaveBalanceController::class, 'bulkAdjustment'])->name('bulk-adjustment');
            Route::post('/bulk-adjustment', [LeaveBalanceController::class, 'processBulkAdjustment'])->name('bulk-adjustment.process');
            Route::post('/bulk-adjustment/preview', [LeaveBalanceController::class, 'previewBulkAdjustment'])->name('bulk-adjustment.preview');
            Route::get('/{employee}', [LeaveBalanceController::class, 'show'])->name('show');
            Route::post('/{balance}/adjust', [LeaveBalanceController::class, 'adjust'])->name('adjust');
            Route::post('/{employee}/reset', [LeaveBalanceController::class, 'reset'])->name('reset');
        });

        // Settings
        Route::prefix('settings')->name('settings.')->group(function () {
            Route::get('/', [SettingsController::class, 'index'])->name('index');
            Route::post('/', [SettingsController::class, 'update'])->name('update');

            // Holidays
            Route::get('/holidays', [SettingsController::class, 'holidays'])->name('holidays');
            Route::post('/holidays', [SettingsController::class, 'storeHoliday'])->name('holidays.store');
            Route::put('/holidays/{holiday}', [SettingsController::class, 'updateHoliday'])->name('holidays.update');
            Route::delete('/holidays/{holiday}', [SettingsController::class, 'destroyHoliday'])->name('holidays.destroy');

            // Employee Types
            Route::get('/employee-types', [SettingsController::class, 'employeeTypes'])->name('employee-types');
            Route::post('/employee-types', [SettingsController::class, 'storeEmployeeType'])->name('employee-types.store');
            Route::put('/employee-types/{employeeType}', [SettingsController::class, 'updateEmployeeType'])->name('employee-types.update');
            Route::delete('/employee-types/{employeeType}', [SettingsController::class, 'destroyEmployeeType'])->name('employee-types.destroy');

        });

        // Email Settings (Super Admin only)
        Route::middleware('role:super_admin')->prefix('settings')->name('settings.')->group(function () {
            Route::get('/email', [SettingsController::class, 'email'])->name('email');
            Route::post('/email', [SettingsController::class, 'updateEmail'])->name('email.update');
            Route::post('/email/test', [SettingsController::class, 'testEmail'])->name('email.test');
        });

        // Reports
        Route::prefix('reports')->name('reports.')->group(function () {
            Route::get('/', [ReportController::class, 'index'])->name('index');
            Route::get('/leave', [ReportController::class, 'leaveReport'])->name('leave');
            Route::get('/department', [ReportController::class, 'departmentReport'])->name('department');
            Route::get('/employee', [ReportController::class, 'employeeReport'])->name('employee');
            Route::get('/leave-type', [ReportController::class, 'leaveTypeReport'])->name('leave-type');
            Route::get('/export', [ReportController::class, 'export'])->name('export');
        });

        // Mass Email
        Route::prefix('mass-email')->name('mass-email.')->group(function () {
            Route::get('/', [MassEmailController::class, 'index'])->name('index');
            Route::post('/preview', [MassEmailController::class, 'preview'])->name('preview');
            Route::post('/send', [MassEmailController::class, 'send'])->name('send');
        });
    });

    // Super Admin only routes
    Route::middleware('role:super_admin')->group(function () {
        // Webhooks
        Route::resource('webhooks', WebhookController::class);
        Route::post('/webhooks/{webhook}/test', [WebhookController::class, 'test'])->name('webhooks.test');
        Route::post('/webhooks/{webhook}/toggle-status', [WebhookController::class, 'toggleStatus'])->name('webhooks.toggle-status');
    });
});
