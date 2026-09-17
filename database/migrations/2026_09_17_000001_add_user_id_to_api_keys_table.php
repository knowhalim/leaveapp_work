<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bind an API key to the user who owns it.
 *
 * Until now a key carried no identity: the caller asserted who they were by
 * putting an address in the request body, and the role check ran against
 * whoever that turned out to be. That was survivable while the only key-auth
 * endpoint emailed its output to the named user — the data still landed in the
 * right inbox. The MCP server returns report rows in the response, so the
 * assertion has to go: a key is now a user, and the role check runs against the
 * key's owner.
 *
 * Nullable, so keys minted before this migration keep working on the existing
 * email-delivery endpoints. The MCP transport refuses them outright.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('api_keys', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('api_keys', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
