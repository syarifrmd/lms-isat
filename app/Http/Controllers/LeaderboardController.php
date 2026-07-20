<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class LeaderboardController extends Controller
{
    public function index(Request $request)
    {
        // 1. Ambil daftar kuis untuk dropdown (Hanya yang memiliki modul, course, dan journey)
        $quizzes = \App\Models\Quiz::whereHas('course', function ($q) {
                $q->whereNotNull('journey_id');
            })
            ->whereNotNull('module_id')
            ->with(['course.journey:id,title', 'course:id,title,journey_id', 'module:id,title'])
            ->get()
            ->map(function ($quiz) {
                $journeyName = $quiz->course && $quiz->course->journey ? $quiz->course->journey->title : 'Tanpa Journey';
                $courseName = $quiz->course ? $quiz->course->title : 'Tanpa Course';
                $moduleName = $quiz->module ? $quiz->module->title : 'Tanpa Modul';
                
                return [
                    'id' => $quiz->id,
                    'name' => "{$journeyName} - {$courseName} - {$moduleName}"
                ];
            });

        $selectedQuizId = $request->input('quiz_id');

        $leaderboardData = [];
        $currentUserRank = null;
        $currentUserData = null;

        if ($selectedQuizId) {
            // 2. Ambil attempt kuis yang terpilih (hanya yang sudah disubmit/selesai)
            // Ambil semua attempt termasuk yang dihapus (soft-deleted) untuk menghitung total waktu
            $allAttemptsForQuiz = \App\Models\UserQuizAttempt::withTrashed()
                ->where('quiz_id', $selectedQuizId)
                ->whereNotNull('submitted_at')
                ->get();
            
            $totalDurations = [];
            foreach ($allAttemptsForQuiz as $a) {
                if ($a->created_at && $a->submitted_at) {
                    $diff = abs(\Carbon\Carbon::parse($a->submitted_at)->diffInSeconds(\Carbon\Carbon::parse($a->created_at)));
                    if (!isset($totalDurations[$a->user_id])) {
                        $totalDurations[$a->user_id] = 0;
                    }
                    $totalDurations[$a->user_id] += $diff;
                }
            }

            $attempts = \App\Models\UserQuizAttempt::with(['user:id,name,avatar,role', 'quiz:id,module_id'])
                ->where('quiz_id', $selectedQuizId)
                ->whereNotNull('submitted_at')
                ->where('is_passed', true)
                ->get()
                ->filter(function ($attempt) {
                    return $attempt->user && $attempt->user->role === 'user';
                })
                ->map(function ($attempt) use ($totalDurations) {
                    $durationSeconds = $totalDurations[$attempt->user_id] ?? 0;

                    $correctCount = \DB::table('user_answers')
                        ->where('attempt_id', $attempt->id)
                        ->where('is_correct', true)
                        ->count();
                    
                    return [
                        'id' => $attempt->id,
                        'user_id' => $attempt->user->id,
                        'name' => $attempt->user->name,
                        'avatar' => $attempt->user->avatar,
                        'score' => $correctCount,
                        'duration_seconds' => $durationSeconds,
                        'is_current_user' => $attempt->user->id === Auth::id(),
                    ];
                });

            // Urutkan collection: score descending, duration_seconds ascending
            $sortedAttempts = $attempts->sort(function ($a, $b) {
                if ($a['score'] == $b['score']) {
                    return $a['duration_seconds'] <=> $b['duration_seconds'];
                }
                return $b['score'] <=> $a['score'];
            })->values();

            // Format data untuk mempermudah frontend (tambah ranking)
            $leaderboardData = $sortedAttempts->map(function ($attempt, $index) use (&$currentUserRank, &$currentUserData) {
                $rank = $index + 1;
                $formattedAttempt = [
                    'rank' => $rank,
                    'user_id' => $attempt['user_id'],
                    'name' => $attempt['name'],
                    'avatar' => $attempt['avatar'],
                    'score' => $attempt['score'],
                    'duration_seconds' => $attempt['duration_seconds'],
                    'is_current_user' => $attempt['is_current_user'],
                ];

                if ($attempt['is_current_user']) {
                    $currentUserRank = $rank;
                    $currentUserData = $formattedAttempt;
                }

                return $formattedAttempt;
            })->take(50); // Batasi top 50 jika perlu
        }

        return Inertia::render('leaderboard/leaderboard', [
            'quizzes' => $quizzes,
            'selectedQuizId' => $selectedQuizId ? (int)$selectedQuizId : null,
            'leaderboard' => $leaderboardData,
            'currentUser' => $currentUserData ? [
                'data' => Auth::user(),
                'rank' => $currentUserRank,
                'score' => $currentUserData['score'],
                'duration_seconds' => $currentUserData['duration_seconds']
            ] : null
        ]);
    }
}