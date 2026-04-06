<?php

use App\Http\Controllers\Api\AuthApiController;
use App\Http\Controllers\Api\LeaveApiController;
use App\Http\Controllers\Api\ReportApiController;
use App\Http\Controllers\Api\UserApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — /api/v1
|--------------------------------------------------------------------------
|
| Authentication (two options):
|
|   Option A — Bearer token (from magic-link login):
|       Authorization: Bearer 1|xxxxxxxxxxxxxxxx
|
|   Option B — API Key (generated in Super Admin → Settings):
|       X-API-Key: <64-char key>
|       or ?api_key=<64-char key>  (query string)
|
| Magic-link endpoints are public (no auth needed).
|
| API Key permissions:
|   leaves.read       — summary, pending, history
|   manager.read      — manager pending-approvals (role also checked in controller)
|   reports.generate  — generate + email reports (role also checked in controller)
|   users.read        — get user profile & balances
|   users.write       — apply leave on behalf of user
|
*/

// ─── Public: Magic-link auth (no auth required) ──────────────────────────────
Route::prefix('v1/auth')->group(function () {
    Route::post('/magic-link',        [AuthApiController::class, 'sendMagicLink']);
    Route::get('/magic-link/{token}', [AuthApiController::class, 'authenticate']);
});

// ─── Bearer-only: logout (revoke Sanctum token) ──────────────────────────────
Route::prefix('v1')->middleware(['auth:sanctum'])->group(function () {
    Route::post('/auth/logout', [AuthApiController::class, 'logout']);
});

// ─── Flexible: Bearer token OR API Key (leave endpoints) ─────────────────────
Route::prefix('v1')->middleware(['api.auth:leaves.read'])->group(function () {
    Route::get('/leaves/balance', [LeaveApiController::class, 'balance']);
    Route::get('/leaves/summary', [LeaveApiController::class, 'summary']);
    Route::get('/leaves/pending', [LeaveApiController::class, 'pending']);
    Route::get('/leaves/history', [LeaveApiController::class, 'history']);
});

// ─── Bearer token only: manager endpoint (identity comes from the token) ─────
Route::prefix('v1')->middleware(['auth:sanctum'])->group(function () {
    Route::get('/manager/pending-approvals', [LeaveApiController::class, 'managerPendingApprovals']);
});

// ─── Flexible: Bearer token OR API Key (report endpoint) ─────────────────────
Route::prefix('v1')->middleware(['api.auth:reports.generate'])->group(function () {
    Route::post('/reports/generate', [ReportApiController::class, 'generate']);
});

// ─── Existing: super_admin Bearer token only (user endpoints) ────────────────
//     These require a logged-in super_admin; API keys not yet supported here.
Route::prefix('v1')->middleware(['auth:sanctum', 'role:super_admin'])->group(function () {
    Route::get('/users/{email}',          [UserApiController::class, 'show']);
    Route::get('/users/{email}/balances', [UserApiController::class, 'balances']);
    Route::post('/users/{email}/leaves',  [UserApiController::class, 'applyLeave']);
});
