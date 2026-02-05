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
        Schema::create('badges', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->enum('rank', ['bronze', 'silver', 'gold', 'platinum']);
            $table->decimal('criteria_rule', 10, 2);
            $table->string('user_id')->nullable();
            $table->decimal('xp_total', 10, 2)->nullable();
            $table->enum('source', ['course_completion', 'quiz_achievement', 'streak', 'manual'])->nullable();
            $table->timestamp('created_at')->useCurrent();
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('badges');
    }
};
