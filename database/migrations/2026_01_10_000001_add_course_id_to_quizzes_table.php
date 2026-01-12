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
        Schema::table('quizzes', function (Blueprint $table) {
            // Add course_id as NOT NULL with foreign key
            $table->foreignId('course_id')->after('id')->constrained('courses')->onDelete('cascade');
            
            // Make module_id nullable (quiz can be course-level or module-specific)
            $table->foreignId('module_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropColumn('course_id');
            
            // Revert module_id back to NOT NULL
            $table->foreignId('module_id')->nullable(false)->change();
        });
    }
};
