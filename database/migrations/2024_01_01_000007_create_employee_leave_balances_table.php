<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_leave_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('leave_type_id')->constrained()->cascadeOnDelete();
            $table->string('financial_year', 9);
            $table->decimal('entitled_days', 5, 1)->default(0);
            $table->decimal('carried_over', 5, 1)->default(0);
            $table->decimal('adjustment', 5, 1)->default(0);
            $table->decimal('used_days', 5, 1)->default(0);
            $table->decimal('pending_days', 5, 1)->default(0);
            $table->timestamps();

            $table->unique(['employee_id', 'leave_type_id', 'financial_year'], 'employee_leave_balance_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_leave_balances');
    }
};
