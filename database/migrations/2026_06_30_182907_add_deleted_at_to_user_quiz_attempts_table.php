<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('user_quiz_attempts', function (Blueprint $table) {
            if (!Schema::hasColumn('user_quiz_attempts', 'is_time_up')) {
                $table->boolean('is_time_up')->default(false)->after('is_passed');
            }
            if (!Schema::hasColumn('user_quiz_attempts', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_quiz_attempts', function (Blueprint $table) {
            if (Schema::hasColumn('user_quiz_attempts', 'is_time_up')) {
                $table->dropColumn('is_time_up');
            }
            if (Schema::hasColumn('user_quiz_attempts', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};
