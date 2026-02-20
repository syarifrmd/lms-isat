<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseRating;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $role = $user->role;
        $youtubeConnected = Storage::disk('local')->exists('google-token.json');

        // ── Admin Dashboard ──────────────────────────────────────────────────
        if ($role === 'admin') {
            // Overview stats
            $totalUsers    = User::count();
            $totalTrainers = User::where('role', 'trainer')->count();
            $totalStudents = User::where('role', 'user')->count();
            $totalCourses  = Course::count();
            $totalEnrollments = Enrollment::count();
            $completedEnrollments = Enrollment::where('status', 'completed')->count();
            $platformAvgRating = CourseRating::avg('rating')
                ? round((float) CourseRating::avg('rating'), 1)
                : null;

            // Course status breakdown
            $coursesByStatus = Course::select('status', DB::raw('count(*) as total'))
                ->groupBy('status')
                ->pluck('total', 'status')
                ->toArray();

            // Most popular courses (by enrollment count)
            $popularCourses = Course::withCount('enrollments')
                ->withAvg('ratings', 'rating')
                ->with('creator:id,name')
                ->orderByDesc('enrollments_count')
                ->limit(5)
                ->get()
                ->map(fn($c) => [
                    'id'               => $c->id,
                    'title'            => $c->title,
                    'status'           => $c->status,
                    'enrollments_count' => $c->enrollments_count,
                    'creator_name'     => $c->creator?->name ?? 'N/A',
                    'average_rating'   => $c->ratings_avg_rating
                        ? round((float) $c->ratings_avg_rating, 1)
                        : null,
                ]);

            // Monthly enrollments for chart (last 6 months)
            $monthlyEnrollments = Enrollment::select(
                    DB::raw("DATE_FORMAT(enrollment_at, '%Y-%m') as month"),
                    DB::raw('count(*) as total')
                )
                ->where('enrollment_at', '>=', now()->subMonths(5)->startOfMonth())
                ->groupBy('month')
                ->orderBy('month')
                ->get()
                ->mapWithKeys(fn($r) => [$r->month => $r->total]);

            // Fill in any missing months with 0
            $months = [];
            for ($i = 5; $i >= 0; $i--) {
                $key = now()->subMonths($i)->format('Y-m');
                $months[$key] = $monthlyEnrollments[$key] ?? 0;
            }

            // Recent enrollments with user + course info
            $recentEnrollments = Enrollment::with(['course:id,title', 'user:id,name'])
                ->orderByDesc('enrollment_at')
                ->limit(8)
                ->get()
                ->map(fn($e) => [
                    'course_title'  => $e->course?->title ?? 'N/A',
                    'user_name'     => $e->user?->name ?? $e->user_id,
                    'status'        => $e->status,
                    'progress'      => $e->progress_percentage,
                    'enrolled_at'   => $e->enrollment_at?->diffForHumans() ?? 'N/A',
                ]);

            // Trainer leaderboard (by total students enrolled across their courses)
            $trainerStats = DB::table('courses')
                ->join('enrollments', 'courses.id', '=', 'enrollments.course_id')
                ->join('users', 'courses.created_by', '=', 'users.id')
                ->select('users.name as trainer_name', DB::raw('count(enrollments.id) as student_total'))
                ->groupBy('courses.created_by', 'users.name')
                ->orderByDesc('student_total')
                ->limit(5)
                ->get()
                ->map(fn($r) => [
                    'trainer_name'  => $r->trainer_name,
                    'student_total' => $r->student_total,
                ]);

            return Inertia::render('dashboard', [
                'adminData' => [
                    'stats' => [
                        'total_users'              => $totalUsers,
                        'total_trainers'           => $totalTrainers,
                        'total_students'           => $totalStudents,
                        'total_courses'            => $totalCourses,
                        'total_enrollments'        => $totalEnrollments,
                        'completed_enrollments'    => $completedEnrollments,
                        'completion_rate'          => $totalEnrollments > 0
                            ? round(($completedEnrollments / $totalEnrollments) * 100, 1)
                            : 0,
                        'platform_avg_rating'      => $platformAvgRating,
                    ],
                    'courses_by_status'   => $coursesByStatus,
                    'popular_courses'     => $popularCourses,
                    'monthly_enrollments' => $months,
                    'recent_enrollments'  => $recentEnrollments,
                    'trainer_stats'       => $trainerStats,
                ],
                'youtube_connected' => $youtubeConnected,
            ]);
        }

        // ── Trainer Dashboard ────────────────────────────────────────────────
        if ($role === 'trainer') {
            $trainerCourses = Course::where('created_by', $user->id)
                ->withCount('enrollments')
                ->withAvg('ratings', 'rating')
                ->get();

            $totalStudents = $trainerCourses->sum('enrollments_count');
            $ratedCourses  = $trainerCourses->whereNotNull('ratings_avg_rating');
            $avgRating     = $ratedCourses->count() > 0
                ? round($ratedCourses->avg('ratings_avg_rating'), 1)
                : null;

            $stats = [
                'total_courses'     => $trainerCourses->count(),
                'total_students'    => $totalStudents,
                'completed_courses' => Course::where('created_by', $user->id)
                    ->where('status', 'published')
                    ->count(),
                'average_rating'    => $avgRating ?? '0.0',
            ];

            $recentCourses = $trainerCourses->take(4)->map(function ($course) {
                return [
                    'id'             => $course->id,
                    'title'          => $course->title,
                    'description'    => $course->description,
                    'students_count' => $course->enrollments_count ?? 0,
                    'progress'       => 0,
                    'rating'         => $course->ratings_avg_rating
                        ? round((float) $course->ratings_avg_rating, 1)
                        : null,
                    'status'         => $course->status,
                    'created_at'     => $course->created_at,
                    'updated_at'     => $course->updated_at,
                ];
            });

            return Inertia::render('dashboard', [
                'dashboardData' => [
                    'stats'          => $stats,
                    'recent_courses' => $recentCourses,
                ],
                'youtube_connected' => $youtubeConnected,
            ]);
        }

        // ── Default (User/Employee) ──────────────────────────────────────────
        return Inertia::render('dashboard', [
            'youtube_connected' => $youtubeConnected,
        ]);
    }
}
