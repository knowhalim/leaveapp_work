<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_type_allowances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leave_type_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_type_id')->constrained()->cascadeOnDelete();
            $table->decimal('days_allowed', 5, 1);
            $table->timestamps();

            $table->unique(['leave_type_id', 'employee_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_type_allowances');
    }
};
