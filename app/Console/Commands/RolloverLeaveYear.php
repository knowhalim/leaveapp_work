<?php

namespace App\Console\Commands;

use App\Models\SystemSetting;
use App\Services\LeaveBalanceService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RolloverLeaveYear extends Command
{
    protected $signature = 'app:rollover-leave-year
                            {--force : Skip the date check and run immediately (for testing)}';

    protected $description = 'Roll over to the new financial year: initialize leave balances for all employees and apply carry-forward from the previous year.';

    public function handle(LeaveBalanceService $balanceService): int
    {
        $currentYear = (int) SystemSetting::getFinancialYear();
        $newYear     = $currentYear + 1;

        $this->info("Starting leave year rollover: {$currentYear} → {$newYear}");
        Log::info("Leave year rollover started: {$currentYear} → {$newYear}");

        // Step 1: Initialize balances for all active employees for the new year
        $this->info("Initializing leave balances for {$newYear}...");
        $initialized = $balanceService->initializeBalancesForAllEmployees((string) $newYear);
        $this->info("  ✓ Initialized balances for {$initialized} employees.");

        // Step 2: Apply carry-forward from current year into the new year's balances
        $this->info("Applying carry-forward from {$currentYear} to {$newYear}...");
        $carried = $balanceService->carryForwardBalances((string) $currentYear, (string) $newYear);
        $this->info("  ✓ Carry-forward applied to {$carried} balances.");

        // Step 3: Advance the financial year setting
        SystemSetting::set('financial_year', (string) $newYear, 'string', 'leave');
        $this->info("  ✓ Financial year setting updated to {$newYear}.");

        Log::info('Leave year rollover completed', [
            'from_year'             => $currentYear,
            'to_year'               => $newYear,
            'employees_initialized' => $initialized,
            'carry_forward_applied' => $carried,
        ]);

        $this->info("Rollover complete! System is now on financial year {$newYear}.");

        return Command::SUCCESS;
    }
}
