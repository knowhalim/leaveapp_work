<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bulk_adjustment_backups', function (Blueprint $table) {
            $table->id();
            $table->string('filename')->unique();
            $table->foreignId('performed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('performed_by_name')->nullable();
            $table->timestamp('performed_at');
            $table->json('settings');
            $table->unsignedInteger('affected_count')->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->timestamp('restored_at')->nullable();
            $table->foreignId('restored_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('performed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bulk_adjustment_backups');
    }
};
