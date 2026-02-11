<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Module;
use App\Models\ModuleChecklistItem;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\Answer;
use Illuminate\Database\Seeder;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        // Get all courses
        $courses = Course::all();

        if ($courses->isEmpty()) {
            echo "No courses found. Please run CourseSeeder first.\n";
            return;
        }

        // Module data for each course
        $modulesData = [
            // Course 1: Introduction to Laravel
            'Introduction to Laravel' => [
                [
                    'title' => 'Laravel Basics',
                    'video_url' => 'https://www.youtube.com/watch?v=MFh0Fd7BsjE',
                    'doc_url' => 'https://laravel.com/docs/installation',
                    'content_text' => 'Pengenalan dasar Laravel framework, instalasi, dan struktur project. Laravel adalah framework PHP modern yang powerful dan elegant untuk membangun web applications.',
                    'order_sequence' => 1,
                    'duration_minutes' => 45,
                    'xp_amounts' => 150,
                    'checklists' => [
                        ['title' => 'Tonton Video Pengenalan Laravel', 'type' => 'video', 'description' => 'Tonton video pengenalan Laravel dan pahami konsep dasar framework', 'order_sequence' => 1, 'xp_reward' => 30],
                        ['title' => 'Baca Dokumentasi Instalasi', 'type' => 'text', 'description' => 'Baca cara instalasi Laravel dan requirement system', 'order_sequence' => 2, 'xp_reward' => 40],
                        ['title' => 'Install Laravel di Komputer', 'type' => 'task', 'description' => 'Install Laravel menggunakan Composer di komputer Anda', 'order_sequence' => 3, 'xp_reward' => 50],
                        ['title' => 'Eksplorasi Struktur Project', 'type' => 'task', 'description' => 'Pelajari struktur folder dan file Laravel', 'order_sequence' => 4, 'xp_reward' => 30],
                    ]
                ],
                [
                    'title' => 'Routing & Controllers',
                    'video_url' => 'https://www.youtube.com/watch?v=routing-demo',
                    'doc_url' => 'https://laravel.com/docs/routing',
                    'content_text' => 'Belajar tentang routing dan controller di Laravel. Routes menangani HTTP requests dan controllers mengatur logic aplikasi.',
                    'order_sequence' => 2,
                    'duration_minutes' => 60,
                    'xp_amounts' => 200,
                    'checklists' => [
                        ['title' => 'Tonton Video Routing', 'type' => 'video', 'description' => 'Pelajari cara membuat routes di Laravel', 'order_sequence' => 1, 'xp_reward' => 40],
                        ['title' => 'Baca Materi Controllers', 'type' => 'text', 'description' => 'Memahami MVC pattern dan controller', 'order_sequence' => 2, 'xp_reward' => 40],
                        ['title' => 'Buat Route Pertama', 'type' => 'task', 'description' => 'Buat route sederhana di web.php', 'order_sequence' => 3, 'xp_reward' => 40],
                        ['title' => 'Buat Controller', 'type' => 'task', 'description' => 'Buat controller menggunakan artisan command', 'order_sequence' => 4, 'xp_reward' => 40],
                        ['title' => 'Quiz Routing', 'type' => 'quiz', 'description' => 'Kerjakan quiz tentang routing dan controller', 'order_sequence' => 5, 'xp_reward' => 40],
                    ]
                ],
                [
                    'title' => 'Database & Eloquent ORM',
                    'video_url' => 'https://www.youtube.com/watch?v=eloquent-demo',
                    'doc_url' => 'https://laravel.com/docs/eloquent',
                    'content_text' => 'Mengenal database migration, seeding, dan Eloquent ORM. Eloquent adalah implementasi Active Record yang elegant untuk bekerja dengan database.',
                    'order_sequence' => 3,
                    'duration_minutes' => 75,
                    'xp_amounts' => 250,
                    'checklists' => [
                        ['title' => 'Tonton Video Database Basics', 'type' => 'video', 'description' => 'Pelajari migration dan seeding', 'order_sequence' => 1, 'xp_reward' => 50],
                        ['title' => 'Baca Materi Eloquent ORM', 'type' => 'text', 'description' => 'Pelajari Eloquent ORM dan relationships', 'order_sequence' => 2, 'xp_reward' => 50],
                        ['title' => 'Buat Migration', 'type' => 'task', 'description' => 'Buat migration untuk table baru', 'order_sequence' => 3, 'xp_reward' => 50],
                        ['title' => 'Buat Model', 'type' => 'task', 'description' => 'Buat Eloquent model', 'order_sequence' => 4, 'xp_reward' => 50],
                        ['title' => 'Quiz Database', 'type' => 'quiz', 'description' => 'Kerjakan quiz tentang database dan Eloquent', 'order_sequence' => 5, 'xp_reward' => 50],
                    ]
                ],
            ],

            // Course 2: Advanced React Development
            'Advanced React Development' => [
                [
                    'title' => 'React Fundamentals',
                    'video_url' => 'https://www.youtube.com/watch?v=react-basics',
                    'doc_url' => 'https://react.dev/learn',
                    'content_text' => 'Pengenalan React components, JSX, dan props. React adalah library JavaScript untuk membangun user interfaces.',
                    'order_sequence' => 1,
                    'duration_minutes' => 50,
                    'xp_amounts' => 180,
                    'checklists' => [
                        ['title' => 'Tonton Video React Basics', 'type' => 'video', 'description' => 'Pelajari dasar-dasar React', 'order_sequence' => 1, 'xp_reward' => 40],
                        ['title' => 'Baca Materi Components', 'type' => 'text', 'description' => 'Memahami component-based architecture', 'order_sequence' => 2, 'xp_reward' => 50],
                        ['title' => 'Buat Component Pertama', 'type' => 'task', 'description' => 'Buat React component sederhana', 'order_sequence' => 3, 'xp_reward' => 50],
                        ['title' => 'Praktik JSX', 'type' => 'task', 'description' => 'Latihan menulis JSX syntax', 'order_sequence' => 4, 'xp_reward' => 40],
                    ]
                ],
                [
                    'title' => 'State Management dengan Hooks',
                    'video_url' => 'https://www.youtube.com/watch?v=react-hooks',
                    'doc_url' => 'https://react.dev/reference/react',
                    'content_text' => 'Belajar tentang useState, useEffect, dan state management di React. Hooks memungkinkan Anda menggunakan state dalam functional components.',
                    'order_sequence' => 2,
                    'duration_minutes' => 65,
                    'xp_amounts' => 220,
                    'checklists' => [
                        ['title' => 'Tonton Video Hooks', 'type' => 'video', 'description' => 'Pelajari React hooks', 'order_sequence' => 1, 'xp_reward' => 50],
                        ['title' => 'Baca Materi useState', 'type' => 'text', 'description' => 'Memahami useState hook', 'order_sequence' => 2, 'xp_reward' => 40],
                        ['title' => 'Baca Materi useEffect', 'type' => 'text', 'description' => 'Memahami useEffect hook', 'order_sequence' => 3, 'xp_reward' => 40],
                        ['title' => 'Implementasi State', 'type' => 'task', 'description' => 'Gunakan useState dalam project', 'order_sequence' => 4, 'xp_reward' => 50],
                        ['title' => 'Quiz Hooks', 'type' => 'quiz', 'description' => 'Kerjakan quiz tentang React hooks', 'order_sequence' => 5, 'xp_reward' => 40],
                    ]
                ],
            ],

            // Course 3: Database Design
            'Database Design' => [
                [
                    'title' => 'Database Fundamentals',
                    'video_url' => 'https://www.youtube.com/watch?v=database-basics',
                    'doc_url' => null,
                    'content_text' => 'Pengenalan database, RDBMS, dan SQL basics. Database adalah sistem untuk menyimpan dan mengelola data secara terstruktur.',
                    'order_sequence' => 1,
                    'duration_minutes' => 45,
                    'xp_amounts' => 150,
                    'checklists' => [
                        ['title' => 'Tonton Video Database Intro', 'type' => 'video', 'description' => 'Pengenalan database dan RDBMS', 'order_sequence' => 1, 'xp_reward' => 40],
                        ['title' => 'Baca Materi SQL', 'type' => 'text', 'description' => 'Pelajari SQL query dasar', 'order_sequence' => 2, 'xp_reward' => 50],
                        ['title' => 'Latihan SQL Query', 'type' => 'task', 'description' => 'Kerjakan latihan SQL SELECT, INSERT, UPDATE', 'order_sequence' => 3, 'xp_reward' => 60],
                    ]
                ],
                [
                    'title' => 'Normalization & ER Diagram',
                    'video_url' => 'https://www.youtube.com/watch?v=normalization',
                    'doc_url' => null,
                    'content_text' => 'Belajar normalisasi database dan membuat ER diagram. Normalisasi adalah proses mengorganisir data untuk mengurangi redundansi.',
                    'order_sequence' => 2,
                    'duration_minutes' => 60,
                    'xp_amounts' => 200,
                    'checklists' => [
                        ['title' => 'Tonton Video Normalisasi', 'type' => 'video', 'description' => 'Pelajari database normalization (1NF, 2NF, 3NF)', 'order_sequence' => 1, 'xp_reward' => 50],
                        ['title' => 'Baca Materi ER Diagram', 'type' => 'text', 'description' => 'Memahami Entity Relationship diagram', 'order_sequence' => 2, 'xp_reward' => 50],
                        ['title' => 'Buat ER Diagram', 'type' => 'task', 'description' => 'Buat ER diagram untuk project sederhana', 'order_sequence' => 3, 'xp_reward' => 60],
                        ['title' => 'Quiz Normalisasi', 'type' => 'quiz', 'description' => 'Kerjakan quiz tentang normalisasi', 'order_sequence' => 4, 'xp_reward' => 40],
                    ]
                ],
            ],

            // Course 4: API Development with Laravel
            'API Development with Laravel' => [
                [
                    'title' => 'RESTful API Concepts',
                    'video_url' => 'https://www.youtube.com/watch?v=rest-api',
                    'doc_url' => 'https://laravel.com/docs/routing#api-routes',
                    'content_text' => 'Pengenalan RESTful API, HTTP methods, dan status codes. REST adalah architectural style untuk distributed systems.',
                    'order_sequence' => 1,
                    'duration_minutes' => 55,
                    'xp_amounts' => 180,
                    'checklists' => [
                        ['title' => 'Tonton Video REST API', 'type' => 'video', 'description' => 'Pelajari REST principles', 'order_sequence' => 1, 'xp_reward' => 40],
                        ['title' => 'Baca Materi HTTP Methods', 'type' => 'text', 'description' => 'Memahami GET, POST, PUT, DELETE', 'order_sequence' => 2, 'xp_reward' => 40],
                        ['title' => 'Buat API Endpoint', 'type' => 'task', 'description' => 'Buat REST endpoint sederhana', 'order_sequence' => 3, 'xp_reward' => 60],
                        ['title' => 'Quiz API', 'type' => 'quiz', 'description' => 'Kerjakan quiz tentang REST API', 'order_sequence' => 4, 'xp_reward' => 40],
                    ]
                ],
                [
                    'title' => 'Authentication & Authorization',
                    'video_url' => 'https://www.youtube.com/watch?v=sanctum',
                    'doc_url' => 'https://laravel.com/docs/sanctum',
                    'content_text' => 'Belajar implementasi authentication dan authorization di API menggunakan Laravel Sanctum.',
                    'order_sequence' => 2,
                    'duration_minutes' => 70,
                    'xp_amounts' => 240,
                    'checklists' => [
                        ['title' => 'Tonton Video Authentication', 'type' => 'video', 'description' => 'Pelajari API authentication', 'order_sequence' => 1, 'xp_reward' => 50],
                        ['title' => 'Baca Materi Sanctum', 'type' => 'text', 'description' => 'Memahami Laravel Sanctum', 'order_sequence' => 2, 'xp_reward' => 50],
                        ['title' => 'Install Sanctum', 'type' => 'task', 'description' => 'Install dan konfigurasi Sanctum', 'order_sequence' => 3, 'xp_reward' => 40],
                        ['title' => 'Implementasi Auth', 'type' => 'task', 'description' => 'Implementasi authentication di API', 'order_sequence' => 4, 'xp_reward' => 60],
                        ['title' => 'Test dengan Postman', 'type' => 'task', 'description' => 'Test API endpoints menggunakan Postman', 'order_sequence' => 5, 'xp_reward' => 40],
                    ]
                ],
            ],
        ];

        foreach ($courses as $course) {
            if (!isset($modulesData[$course->title])) {
                continue;
            }

            $modules = $modulesData[$course->title];

            foreach ($modules as $moduleData) {
                // Extract checklists
                $checklists = $moduleData['checklists'];
                unset($moduleData['checklists']);

                // Create module
                $module = Module::firstOrCreate(
                    [
                        'course_id' => $course->id,
                        'title' => $moduleData['title']
                    ],
                    array_merge($moduleData, ['course_id' => $course->id])
                );

                // Create checklist items for this module
                foreach ($checklists as $checklistData) {
                    ModuleChecklistItem::firstOrCreate(
                        [
                            'module_id' => $module->id,
                            'title' => $checklistData['title'],
                            'order_sequence' => $checklistData['order_sequence']
                        ],
                        array_merge($checklistData, ['module_id' => $module->id])
                    );

                    // Creates Quiz if type is quiz
                    if ($checklistData['type'] === 'quiz') {
                        $quiz = Quiz::firstOrCreate(
                            ['module_id' => $module->id, 'title' => $checklistData['title']],
                            [
                                'course_id' => $course->id,
                                'min_score' => 0,
                                'passing_score' => 70,
                                'is_timed' => true,
                                'time_limit_second' => 600, // 10 minutes
                                'xp_bonus' => 50,
                            ]
                        );

                        // Create sample questions if they don't exist
                        if ($quiz->questions()->count() === 0) {
                            $q1 = Question::create([
                                'quiz_id' => $quiz->id,
                                'question_text' => 'What is the main purpose of ' . $module->title . '?',
                                'point' => 50,
                            ]);
                            
                            Answer::create(['question_id' => $q1->id, 'answer_text' => 'To make development easier', 'is_correct' => true]);
                            Answer::create(['question_id' => $q1->id, 'answer_text' => 'To complicate things', 'is_correct' => false]);
                            Answer::create(['question_id' => $q1->id, 'answer_text' => 'No purpose', 'is_correct' => false]);
                            Answer::create(['question_id' => $q1->id, 'answer_text' => 'Unknown', 'is_correct' => false]);

                            $q2 = Question::create([
                                'quiz_id' => $quiz->id,
                                'question_text' => 'Is ' . $module->title . ' important?',
                                'point' => 50,
                            ]);

                            Answer::create(['question_id' => $q2->id, 'answer_text' => 'Yes, very much', 'is_correct' => true]);
                            Answer::create(['question_id' => $q2->id, 'answer_text' => 'No', 'is_correct' => false]);
                        }
                    }
                }
            }
        }

        echo "Modules and Checklist Items seeded successfully!\n";
    }
}
