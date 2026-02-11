<?php

namespace Database\Seeders;

use App\Models\PublicHoliday;
use Illuminate\Database\Seeder;

class PublicHolidaySeeder extends Seeder
{
    public function run(): void
    {
        $year = date('Y');

        $holidays = [
            [
                'name' => 'New Year\'s Day',
                'date' => "{$year}-01-01",
                'is_recurring' => true,
                'description' => 'First day of the new year',
            ],
            [
                'name' => 'Labour Day',
                'date' => "{$year}-05-01",
                'is_recurring' => true,
                'description' => 'International Workers\' Day',
            ],
            [
                'name' => 'National Day',
                'date' => "{$year}-08-31",
                'is_recurring' => true,
                'description' => 'National Independence Day',
            ],
            [
                'name' => 'Christmas Day',
                'date' => "{$year}-12-25",
                'is_recurring' => true,
                'description' => 'Christmas celebration',
            ],
        ];

        foreach ($holidays as $holiday) {
            PublicHoliday::create($holiday);
        }
    }
}
