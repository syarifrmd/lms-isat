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
        Schema::table('users', function (Blueprint $table) {
            $table->string('brand', 255)->nullable()->after('division');
            $table->string('micro_cluster', 255)->nullable()->after('brand');
            $table->string('branch', 255)->nullable()->after('micro_cluster');
            $table->string('area', 255)->nullable()->after('branch');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function up_down(): void 
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['brand', 'micro_cluster', 'branch', 'area']);
        });
    }
    
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['brand', 'micro_cluster', 'branch', 'area']);
        });
    }
};