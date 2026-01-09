<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Profile;
use Illuminate\Database\Seeder;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        // Find a trainer profile or create one
        $trainer = Profile::where('role', 'trainer')->first();

        if (!$trainer) {
            echo "No trainer found. Please create a trainer user first.\n";
            return;
        }

        // Create sample courses
        $courses = [
            [
                'title' => 'Introduction to Laravel',
                'description' => 'Learn the basics of Laravel framework',
                'category' => 'Programming',
                'duration' => 120,
                'created_by' => $trainer->user_id,
                'status' => 'published',
            ],
            [
                'title' => 'Advanced React Development',
                'description' => 'Master React and build modern web applications',
                'category' => 'Web Development',
                'duration' => 180,
                'created_by' => $trainer->user_id,
                'status' => 'published',
            ],
            [
                'title' => 'Database Design',
                'description' => 'Learn how to design efficient databases',
                'category' => 'Database',
                'duration' => 90,
                'created_by' => $trainer->user_id,
                'status' => 'published',
            ],
            [
                'title' => 'API Development',
                'description' => 'Build RESTful APIs with Laravel',
                'category' => 'Backend',
                'duration' => 150,
                'created_by' => $trainer->user_id,
                'status' => 'draft',
            ],
        ];

        foreach ($courses as $courseData) {
            $course = Course::create($courseData);

            // Create some sample enrollments for published courses
            if ($course->status === 'published') {
                $students = Profile::where('role', 'user')
                    ->limit(rand(20, 50))
                    ->get();

                foreach ($students as $student) {
                    Enrollment::create([
                        'user_id' => $student->user_id,
                        'course_id' => $course->id,
                        'progress_percentage' => rand(0, 100),
                        'status' => rand(0, 100) > 80 ? 'completed' : 'in_progress',
                        'enrollment_at' => now(),
                        'completed_at' => rand(0, 100) > 80 ? now() : null,
                    ]);
                }
            }
        }

        echo "Courses seeded successfully!\n";
    }
}
