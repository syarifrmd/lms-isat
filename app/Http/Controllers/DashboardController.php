<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $role = $user->profile?->role;
        $youtubeConnected = Storage::disk('local')->exists('google-token.json');

        // Data untuk Trainer Dashboard
        if ($role === 'trainer') {
            $trainerCourses = Course::where('created_by', $user->id)
                ->withCount('enrollments')
                ->get();

            $totalStudents = 0;
            $totalRating = 0;
            $ratingCount = 0;

            foreach ($trainerCourses as $course) {
                $totalStudents += $course->enrollments_count;
                // TODO: Add rating system later if needed
            }

            $stats = [
                'total_courses' => $trainerCourses->count(),
                'total_students' => $totalStudents,
                'completed_courses' => Course::where('created_by', $user->id)
                    ->where('status', 'published')
                    ->count(),
                'average_rating' => '0.0', // TODO: Implement rating system
            ];

            $recentCourses = $trainerCourses->take(4)->map(function ($course) {
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'description' => $course->description,
                    'students_count' => $course->enrollments_count ?? 0,
                    'progress' => 0, // TODO: Calculate average progress
                    'rating' => null,
                    'status' => $course->status,
                    'created_at' => $course->created_at,
                    'updated_at' => $course->updated_at,
                ];
            });

            return Inertia::render('dashboard', [
                'dashboardData' => [
                    'stats' => $stats,
                    'recent_courses' => $recentCourses,
                ],
                'youtube_connected' => $youtubeConnected
            ]);
        }

        // Default dashboard untuk role lain
        return Inertia::render('dashboard', [
            'youtube_connected' => $youtubeConnected
        ]);
    }
}
