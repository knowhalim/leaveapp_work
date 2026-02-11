<?php

namespace Database\Seeders;

use App\Models\EmployeeType;
use Illuminate\Database\Seeder;

class EmployeeTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'name' => 'Full-Time',
                'description' => 'Permanent full-time employees',
                'is_active' => true,
            ],
            [
                'name' => 'Part-Time',
                'description' => 'Part-time employees working less than 40 hours per week',
                'is_active' => true,
            ],
            [
                'name' => 'Contract',
                'description' => 'Contracted employees with fixed-term agreements',
                'is_active' => true,
            ],
            [
                'name' => 'Intern',
                'description' => 'Interns and trainees',
                'is_active' => true,
            ],
        ];

        foreach ($types as $type) {
            EmployeeType::create($type);
        }
    }
}
