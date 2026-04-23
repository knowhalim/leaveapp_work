<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leave_types', function (Blueprint $table) {
            $table->boolean('allow_attachment')->default(false)->after('requires_attachment');
        });

        DB::table('leave_types')
            ->where('requires_attachment', true)
            ->update(['allow_attachment' => true]);
    }

    public function down(): void
    {
        Schema::table('leave_types', function (Blueprint $table) {
            $table->dropColumn('allow_attachment');
        });
    }
};
