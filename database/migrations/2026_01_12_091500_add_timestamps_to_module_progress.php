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
        Schema::table('module_progress', function (Blueprint $table) {
            // Check if created_at exists, if not add it
            if (!Schema::hasColumn('module_progress', 'created_at')) {
                $table->timestamp('created_at')->nullable()->useCurrent();
            }
             // Check if updated_at exists, if not add it (although it seems it does)
            if (!Schema::hasColumn('module_progress', 'updated_at')) {
                 $table->timestamp('updated_at')->nullable()->useCurrentOnUpdate();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('module_progress', function (Blueprint $table) {
             if (Schema::hasColumn('module_progress', 'created_at')) {
                $table->dropColumn('created_at');
             }
        });
    }
};
