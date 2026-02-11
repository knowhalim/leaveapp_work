<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key' => 'company_name',
                'value' => 'HR Leave System',
                'type' => 'string',
                'group' => 'general',
            ],
            [
                'key' => 'financial_year',
                'value' => date('Y'),
                'type' => 'string',
                'group' => 'general',
            ],
            [
                'key' => 'weekends',
                'value' => json_encode(['saturday', 'sunday']),
                'type' => 'array',
                'group' => 'general',
            ],
            [
                'key' => 'max_carry_forward',
                'value' => '5',
                'type' => 'integer',
                'group' => 'leave',
            ],
            [
                'key' => 'leave_year_start_month',
                'value' => '1',
                'type' => 'integer',
                'group' => 'leave',
            ],
            [
                'key' => 'require_reason_for_leave',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'leave',
            ],
            [
                'key' => 'allow_negative_balance',
                'value' => 'false',
                'type' => 'boolean',
                'group' => 'leave',
            ],
            [
                'key' => 'min_advance_days',
                'value' => '1',
                'type' => 'integer',
                'group' => 'leave',
            ],
        ];

        foreach ($settings as $setting) {
            SystemSetting::create($setting);
        }
    }
}
