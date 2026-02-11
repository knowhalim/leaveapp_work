<?php

namespace App\Services;

use App\Models\PublicHoliday;
use App\Models\SystemSetting;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class LeaveCalculationService
{
    protected array $weekends;

    public function __construct()
    {
        $this->weekends = SystemSetting::getWeekends();
    }

    public function calculateLeaveDays(
        string $startDate,
        string $endDate,
        string $startHalf = 'full',
        string $endHalf = 'full'
    ): float {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        if ($start->equalTo($end)) {
            if ($startHalf === 'full') {
                return $this->isWorkingDay($start) ? 1 : 0;
            }
            return $this->isWorkingDay($start) ? 0.5 : 0;
        }

        $totalDays = 0;

        $period = CarbonPeriod::create($start, $end);

        foreach ($period as $date) {
            if (!$this->isWorkingDay($date)) {
                continue;
            }

            if ($date->equalTo($start) && $startHalf !== 'full') {
                $totalDays += 0.5;
            } elseif ($date->equalTo($end) && $endHalf !== 'full') {
                $totalDays += 0.5;
            } else {
                $totalDays += 1;
            }
        }

        return $totalDays;
    }

    public function isWorkingDay(Carbon $date): bool
    {
        if ($this->isWeekend($date)) {
            return false;
        }

        if ($this->isPublicHoliday($date)) {
            return false;
        }

        return true;
    }

    public function isWeekend(Carbon $date): bool
    {
        $dayName = strtolower($date->format('l'));
        return in_array($dayName, $this->weekends);
    }

    public function isPublicHoliday(Carbon $date): bool
    {
        $holiday = PublicHoliday::where('date', $date->format('Y-m-d'))->first();

        if ($holiday) {
            return true;
        }

        $recurringHoliday = PublicHoliday::where('is_recurring', true)
            ->whereMonth('date', $date->month)
            ->whereDay('date', $date->day)
            ->first();

        return $recurringHoliday !== null;
    }

    public function getWorkingDaysInPeriod(string $startDate, string $endDate): int
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        $count = 0;

        $period = CarbonPeriod::create($start, $end);

        foreach ($period as $date) {
            if ($this->isWorkingDay($date)) {
                $count++;
            }
        }

        return $count;
    }

    public function getHolidaysInPeriod(string $startDate, string $endDate): array
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        return PublicHoliday::whereBetween('date', [$start, $end])
            ->get()
            ->toArray();
    }

    public function getWeekendDaysInPeriod(string $startDate, string $endDate): int
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        $count = 0;

        $period = CarbonPeriod::create($start, $end);

        foreach ($period as $date) {
            if ($this->isWeekend($date)) {
                $count++;
            }
        }

        return $count;
    }
}
