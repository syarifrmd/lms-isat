<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class LeaderboardController extends Controller
{
    public function index(Request $request)
    {
        // 1. Ambil daftar course untuk dropdown (hanya yang punya journey dan punya quiz)
        $courses = \App\Models\Course::whereNotNull('journey_id')
            ->whereHas('quizzes')
            ->with(['journey:id,title'])
            ->get()
            ->map(function ($course) {
                $journeyName = $course->journey ? $course->journey->title : 'Tanpa Journey';
                return [
                    'id'   => $course->id,
                    'name' => "{$journeyName} - {$course->title}",
                ];
            });

        $selectedCourseId = $request->input('course_id');

        $leaderboardData  = [];
        $currentUserRank  = null;
        $currentUserData  = null;
        $totalQuizzesInCourse = 0;

        if ($selectedCourseId) {
            // 2. Ambil semua quiz yang ada di course ini
            $quizIds = \App\Models\Quiz::where('course_id', $selectedCourseId)
                ->pluck('id');

            $totalQuizzesInCourse = $quizIds->count();

            if ($quizIds->isNotEmpty()) {
                // 3. Semua attempt (termasuk soft-deleted) untuk menghitung total durasi per user
                $allAttempts = \App\Models\UserQuizAttempt::withTrashed()
                    ->whereIn('quiz_id', $quizIds)
                    ->whereNotNull('submitted_at')
                    ->get();

                // Hitung total durasi per user (akumulasi dari semua quiz)
                $totalDurations = [];
                foreach ($allAttempts as $a) {
                    if ($a->created_at && $a->submitted_at) {
                        $diff = abs(\Carbon\Carbon::parse($a->submitted_at)->diffInSeconds(\Carbon\Carbon::parse($a->created_at)));
                        $totalDurations[$a->user_id] = ($totalDurations[$a->user_id] ?? 0) + $diff;
                    }
                }

                // 4. Ambil attempt yang sudah selesai (submitted) untuk tiap quiz per user
                //    Gunakan attempt manapun (tidak harus is_passed) untuk menghitung benar & quiz dikerjakan
                $attempts = \App\Models\UserQuizAttempt::with(['user:id,name,avatar,role'])
                    ->whereIn('quiz_id', $quizIds)
                    ->whereNotNull('submitted_at')
                    ->get()
                    ->filter(fn($a) => $a->user && $a->user->role === 'user');

                // 5. Group per user → hitung total benar & jumlah quiz yang dikerjakan (distinct quiz_id)
                $grouped = $attempts->groupBy('user_id');

                $rows = $grouped->map(function ($userAttempts) use ($totalDurations, $totalQuizzesInCourse) {
                    $user = $userAttempts->first()->user;

                    // Total jawaban benar dari semua attempt di course ini
                    $attemptIds   = $userAttempts->pluck('id');
                    $totalCorrect = DB::table('user_answers')
                        ->whereIn('attempt_id', $attemptIds)
                        ->where('is_correct', true)
                        ->count();

                    // Jumlah quiz berbeda yang sudah dikerjakan
                    $quizzesDone = $userAttempts->pluck('quiz_id')->unique()->count();

                    $durationSeconds = $totalDurations[$user->id] ?? 0;

                    return [
                        'user_id'          => $user->id,
                        'name'             => $user->name,
                        'avatar'           => $user->avatar,
                        'score'            => $totalCorrect,
                        'quizzes_done'     => $quizzesDone,
                        'total_quizzes'    => $totalQuizzesInCourse,
                        'duration_seconds' => $durationSeconds,
                        'is_current_user'  => $user->id === Auth::id(),
                    ];
                })->values();

                // 6. Urutkan: total benar desc, durasi asc
                $sorted = $rows->sort(function ($a, $b) {
                    if ($a['score'] === $b['score']) {
                        return $a['duration_seconds'] <=> $b['duration_seconds'];
                    }
                    return $b['score'] <=> $a['score'];
                })->values();

                // 7. Tambahkan ranking
                $leaderboardData = $sorted->map(function ($row, $index) use (&$currentUserRank, &$currentUserData) {
                    $rank = $index + 1;
                    $formatted = array_merge($row, ['rank' => $rank]);

                    if ($row['is_current_user']) {
                        $currentUserRank = $rank;
                        $currentUserData = $formatted;
                    }

                    return $formatted;
                })->take(50);
            }
        }

        return Inertia::render('leaderboard/leaderboard', [
            'courses'         => $courses,
            'selectedCourseId' => $selectedCourseId ? (int)$selectedCourseId : null,
            'leaderboard'     => $leaderboardData,
            'currentUser'     => $currentUserData ? [
                'data'             => Auth::user(),
                'rank'             => $currentUserRank,
                'score'            => $currentUserData['score'],
                'quizzes_done'     => $currentUserData['quizzes_done'],
                'total_quizzes'    => $currentUserData['total_quizzes'],
                'duration_seconds' => $currentUserData['duration_seconds'],
            ] : null,
        ]);
    }
}