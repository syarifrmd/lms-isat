<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseRating;
use App\Models\Enrollment;
use App\Models\ModuleProgress;
use App\Models\User;
use App\Models\UserQuizAttempt;
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

        // ── Admin Dashboard 
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
        $userId = $user->id;

        // Stats
        $enrolledCount    = Enrollment::where('user_id', $userId)->count();
        $completedCount   = Enrollment::where('user_id', $userId)->whereNotNull('completed_at')->count();
        $quizAttemptCount = UserQuizAttempt::where('user_id', $userId)->count();
        $passedQuizCount  = UserQuizAttempt::where('user_id', $userId)->where('is_passed', true)->count();
        $xp               = $user->xp ?? 0;
        $leaderboardRank  = DB::table('users')
            ->where('role', 'user')
            ->where('xp', '>', $xp)
            ->count() + 1;

        // Active (in-progress) enrollments
        $activeCourses = Enrollment::where('user_id', $userId)
            ->whereNull('completed_at')
            ->with(['course:id,title,cover_url,category,created_by', 'course.creator:id,name'])
            ->orderByDesc('enrollment_at')
            ->limit(4)
            ->get()
            ->map(fn ($e) => [
                'course_id'    => $e->course_id,
                'title'        => $e->course?->title ?? 'N/A',
                'cover_url'    => $e->course?->cover_url,
                'category'     => $e->course?->category,
                'creator_name' => $e->course?->creator?->name ?? 'N/A',
                'progress'     => (float) ($e->progress_percentage ?? 0),
                'enrolled_at'  => $e->enrollment_at?->diffForHumans() ?? 'N/A',
            ]);

        // Recent quiz attempts
        $recentAttempts = UserQuizAttempt::where('user_id', $userId)
            ->with(['quiz:id,title', 'course:id,title'])
            ->orderByDesc('submitted_at')
            ->limit(5)
            ->get()
            ->map(fn ($a) => [
                'quiz_title'   => $a->quiz?->title ?? 'N/A',
                'course_title' => $a->course?->title ?? 'N/A',
                'score'        => (float) ($a->score ?? 0),
                'is_passed'    => (bool) $a->is_passed,
                'submitted_at' => $a->submitted_at?->diffForHumans() ?? 'N/A',
            ]);

        // Aktivitas mingguan — baca dari tabel user_daily_activity (7 hari terakhir)
        $activityRows = DB::table('user_daily_activity')
            ->where('user_id', $userId)
            ->whereBetween('date', [now()->subDays(6)->toDateString(), now()->toDateString()])
            ->pluck('minutes', 'date'); // ['2026-02-19' => 45, ...]

        $weeklyProgress = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $weeklyProgress[] = [
                'day'     => $date->locale('id')->isoFormat('ddd'),
                'date'    => $date->format('d M'),
                'minutes' => (int) ($activityRows[$date->toDateString()] ?? 0),
            ];
        }

        // Kalender: course yang diikuti beserta durasi (start_date – end_date)
        $enrolledCourses = Enrollment::where('user_id', $userId)
            ->with('course:id,title,start_date,end_date')
            ->get()
            ->filter(fn ($e) => $e->course && ($e->course->start_date || $e->course->end_date))
            ->values()
            ->map(fn ($e, $idx) => [
                'course_id'   => $e->course->id,
                'title'       => $e->course->title,
                'start_date'  => $e->course->start_date?->format('Y-m-d'),
                'end_date'    => $e->course->end_date?->format('Y-m-d'),
                'color_index' => $idx % 6,
            ]);

        return Inertia::render('dashboard', [
            'userData' => [
                'stats' => [
                    'enrolled_courses'  => $enrolledCount,
                    'completed_courses' => $completedCount,
                    'quiz_attempts'     => $quizAttemptCount,
                    'passed_quizzes'    => $passedQuizCount,
                    'certificates'      => $completedCount,
                    'xp'                => $xp,
                    'rank'              => $leaderboardRank,
                ],
                'active_courses'   => $activeCourses,
                'recent_attempts'  => $recentAttempts,
                'weekly_progress'  => $weeklyProgress,
                'course_calendar'  => $enrolledCourses,
            ],
            'youtube_connected' => $youtubeConnected,
        ]);
    }
}
