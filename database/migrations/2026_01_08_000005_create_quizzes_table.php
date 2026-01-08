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
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('modules')->onDelete('cascade');
            $table->string('title');
            $table->integer('min_score')->default(0);
            $table->integer('passing_score')->nullable();
            $table->boolean('is_timed')->nullable(); // Changed to boolean/tinyint(1) if intended as flag, or keep integer
            $table->integer('time_limit_second')->nullable();
            $table->decimal('xp_bonus', 10, 2)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quizzes');
    }
};
