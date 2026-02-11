<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        // Find a trainer user or create one
        $trainer = User::where('role', 'trainer')->first();

        if (!$trainer) {
            // Create a trainer user
            $trainer = User::create([
                'id' => 'TRAINER01',
                'name' => 'Trainer Demo',
                'email' => 'trainer@example.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'trainer',
                'is_registered' => true,
            ]);
        }

        // Create sample courses
        $courses = [
            [
                'title' => 'Introduction to Laravel',
                'description' => 'Learn the basics of Laravel framework, including routing, controllers, Eloquent ORM, and more.',
                'category' => 'Programming',
                'start_date' => now(),
                'end_date' => now()->addMonths(3),
                'created_by' => $trainer->id,
                'status' => 'published',
                'cover_url' => 'https://via.placeholder.com/800x400?text=Laravel',
            ],
            [
                'title' => 'Advanced React Development',
                'description' => 'Master React and build modern web applications with hooks, state management, and more.',
                'category' => 'Web Development',
                'start_date' => now(),
                'end_date' => now()->addMonths(4),
                'created_by' => $trainer->id,
                'status' => 'published',
                'cover_url' => 'https://via.placeholder.com/800x400?text=React',
            ],
            [
                'title' => 'Database Design',
                'description' => 'Learn how to design efficient databases, normalization, ER diagrams, and SQL optimization.',
                'category' => 'Database',
                'start_date' => now(),
                'end_date' => now()->addMonths(2),
                'created_by' => $trainer->id,
                'status' => 'published',
                'cover_url' => 'https://via.placeholder.com/800x400?text=Database',
            ],
            [
                'title' => 'API Development with Laravel',
                'description' => 'Build RESTful APIs with Laravel, including authentication, authorization, and best practices.',
                'category' => 'Backend',
                'start_date' => now()->addWeek(),
                'end_date' => now()->addMonths(3),
                'created_by' => $trainer->id,
                'status' => 'published',
                'cover_url' => 'https://via.placeholder.com/800x400?text=API',
            ],
        ];

        foreach ($courses as $courseData) {
            Course::firstOrCreate(
                ['title' => $courseData['title']],
                $courseData
            );
        }

        echo "Courses seeded successfully!\n";
    }
}
