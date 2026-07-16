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

        // ── Tentukan scope user (diri sendiri + bawahan) berdasarkan hirarki division ──
        // HOC lihat semua di circle-nya, HOR lihat semua di region-nya, HOS lihat semua
        // di area-nya, BSM lihat semua di branch-nya, CSE/RSE lihat semua di micro_cluster-nya
        // (bareng DSE di micro_cluster yang sama), DSE hanya diri sendiri.
        // Hanya user dengan brand yang SAMA yang dihitung — KECUALI brand 'IOH',
        // yang bisa melihat lintas brand (IOH + brand lain, mis. 3ID).
        $divisionUpper = strtoupper((string) $user->division);
        $brandUpper     = strtoupper((string) $user->brand);

        $scopeUserIdsQuery = User::query();
        if ($brandUpper !== 'IOH') {
            $scopeUserIdsQuery->where('brand', $user->brand);
        }
        // brand IOH: tidak difilter -> ikut semua brand

        if ($divisionUpper === 'HOC') {
            $scopeUserIdsQuery->where('circle', $user->circle);
        } elseif ($divisionUpper === 'HOR') {
            $scopeUserIdsQuery->where('region', $user->region);
        } elseif ($divisionUpper === 'HOS') {
            $scopeUserIdsQuery->where('area', $user->area);
        } elseif ($divisionUpper === 'BSM') {
            $scopeUserIdsQuery->where('branch', $user->branch);
        } elseif (in_array($divisionUpper, ['CSE', 'RSE'], true)) {
            $scopeUserIdsQuery->where('micro_cluster', $user->micro_cluster);
        } else {
            // DSE (atau division lain yang tidak dikenal): hanya diri sendiri
            $scopeUserIdsQuery->where('id', $userId);
        }

        $scopeUserIds = $scopeUserIdsQuery->pluck('id');

        // Stats (hanya untuk kursus mandatory) — diri sendiri + bawahan dalam scope
        $enrolledCount    = Enrollment::whereIn('user_id', $scopeUserIds)
            ->whereHas('course', fn ($q) => $q->where('is_mandatory', 1))
            ->count();
        $completedCount   = Enrollment::whereIn('user_id', $scopeUserIds)
            ->whereNotNull('completed_at')
            ->whereHas('course', fn ($q) => $q->where('is_mandatory', 1))
            ->count();
        $quizAttemptCount = UserQuizAttempt::whereIn('user_id', $scopeUserIds)
            ->whereHas('course', fn ($q) => $q->where('is_mandatory', 1))
            ->count();
        $passedQuizCount  = UserQuizAttempt::whereIn('user_id', $scopeUserIds)
            ->where('is_passed', true)
            ->whereHas('course', fn ($q) => $q->where('is_mandatory', 1))
            ->count();
        $xp               = $user->xp ?? 0;
        $leaderboardRank  = DB::table('users')
            ->where('role', 'user')
            ->where('xp', '>', $xp)
            ->count() + 1;

        // Course Tersedia / Modul Tersedia: course yang punya journey, DAN journey itu
        // di-assign ke DIVISION SENDIRI SAJA (lewat journey_divisions.target_division)
        // dengan status is_mandatory di level journey_divisions — supaya konsisten dengan
        // halaman "My Learning" (tidak pakai rollup ke bawahan, murni division sendiri).
        $coursesAvailableCount = Course::whereNotNull('journey_id')
            ->whereHas('journey.divisions', function ($q) use ($divisionUpper) {
                $q->where('target_division', $divisionUpper)->where('is_mandatory', 1);
            })
            ->count();

        $modulesAvailableCount = Course::whereNotNull('journey_id')
            ->whereHas('journey.divisions', function ($q) use ($divisionUpper) {
                $q->where('target_division', $divisionUpper)->where('is_mandatory', 1);
            })
            ->withCount('modules')
            ->get()
            ->sum('modules_count');

        // Modul Selesai: jumlah modul yang sudah diselesaikan oleh diri sendiri + bawahan
        // dalam scope, untuk course mandatory yang punya journey.
        $modulesCompletedCount = ModuleProgress::where('is_completed', true)
            ->whereHas('enrollment', fn ($q) => $q->whereIn('user_id', $scopeUserIds))
            ->whereHas('module.course', function ($q) {
                $q->where('is_mandatory', 1)->whereNotNull('journey_id');
            })
            ->count();

        // Active enrollments for dashboard cards (exclude completed/dropped)
        $activeCourses = Enrollment::where('user_id', $userId)
            ->whereIn('status', ['enrolled', 'in_progress'])
            ->where(function ($q) {
                $q->whereNull('completed_at')
                    ->orWhere('progress_percentage', '<', 100);
            })
            ->whereHas('course', function ($q) {
                $q->where('status', 'published')
                    ->where('is_mandatory', 1);
            })
            ->with(['course:id,title,cover_url,category,created_by', 'course.creator:id,name'])
            ->orderByRaw("CASE WHEN status = 'in_progress' THEN 0 ELSE 1 END")
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
            ->whereHas('course', fn ($q) => $q->where('is_mandatory', 1))
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
            ->whereHas('course', fn ($q) => $q->where('is_mandatory', 1))
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
                    'courses_available' => $coursesAvailableCount,
                    'modules_available' => $modulesAvailableCount,
                    'modules_completed' => $modulesCompletedCount,
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