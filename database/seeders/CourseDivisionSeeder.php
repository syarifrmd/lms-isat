<?php

namespace Database\Seeders;

use App\Models\Course;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CourseDivisionSeeder extends Seeder
{
    private const DIVISIONS = ['HOC', 'HOR', 'HOS', 'BSM', 'CSE', 'DSE'];

    public function run(): void
    {
        $courses = Course::orderBy('created_at')->get();

        foreach ($courses as $position => $course) {
            foreach (self::DIVISIONS as $division) {
                DB::table('course_division')->updateOrInsert(
                    [
                        'course_id' => $course->id,
                        'target_division' => $division,
                    ],
                    [
                        'position' => $position + 1,
                        'prerequisite_course_id' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }
    }
}
