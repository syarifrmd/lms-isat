<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Existing accounts without a role become standard learners before the
        // database constraint is applied.
        DB::table('users')->whereNull('role')->update(['role' => 'user']);

        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'trainer', 'user'])
                ->default('user')
                ->nullable(false)
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'trainer', 'user'])
                ->nullable()
                ->change();
        });
    }
};
