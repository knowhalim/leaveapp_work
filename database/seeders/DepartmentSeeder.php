<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name' => 'Human Resources', 'is_active' => true],
            ['name' => 'Engineering', 'is_active' => true],
            ['name' => 'Finance', 'is_active' => true],
            ['name' => 'Marketing', 'is_active' => true],
            ['name' => 'Operations', 'is_active' => true],
            ['name' => 'Sales', 'is_active' => true],
        ];

        foreach ($departments as $department) {
            Department::create($department);
        }
    }
}
