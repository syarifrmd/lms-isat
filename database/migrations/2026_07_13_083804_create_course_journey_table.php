<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('course_journey', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
            $table->foreignId('journey_id')->constrained('journeys')->onDelete('cascade');
            $table->timestamps();
        });

        // Migrate existing journey_id data
        $courses = DB::table('courses')->whereNotNull('journey_id')->get();
        foreach ($courses as $course) {
            DB::table('course_journey')->insert([
                'course_id' => $course->id,
                'journey_id' => $course->journey_id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Drop journey_id from courses
        Schema::table('courses', function (Blueprint $table) {
            $table->dropForeign(['journey_id']);
            $table->dropColumn('journey_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->foreignId('journey_id')->nullable()->constrained('journeys')->onDelete('set null');
        });

        // Restore data
        $courseJourneys = DB::table('course_journey')->get();
        foreach ($courseJourneys as $cj) {
            DB::table('courses')->where('id', $cj->course_id)->update(['journey_id' => $cj->journey_id]);
        }

        Schema::dropIfExists('course_journey');
    }
};
