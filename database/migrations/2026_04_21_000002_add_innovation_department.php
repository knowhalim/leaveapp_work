<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $exists = DB::table('departments')->where('name', 'Innovation')->exists();

        if (! $exists) {
            DB::table('departments')->insert([
                'name' => 'Innovation',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('departments')->where('name', 'Innovation')->delete();
    }
};
