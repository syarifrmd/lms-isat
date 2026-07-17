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
            // Diurutkan berdasarkan score tertinggi, lalu waktu pengerjaan tercepat
            $attempts = \App\Models\UserQuizAttempt::with(['user:id,name,avatar,role', 'quiz:id,module_id'])
                ->where('quiz_id', $selectedQuizId)
                ->whereNotNull('submitted_at')
                ->where('is_passed', true)
                ->get()
                ->filter(function ($attempt) {
                    return $attempt->user && $attempt->user->role === 'user';
                })
                ->map(function ($attempt) {
                    $durationSeconds = 0;
                    
                    if ($attempt->quiz && $attempt->quiz->module_id) {
                        $moduleProgress = \DB::table('module_progress')
                            ->join('enrollments', 'enrollments.id', '=', 'module_progress.enrollment_id')
                            ->where('enrollments.user_id', $attempt->user_id)
                            ->where('module_progress.module_id', $attempt->quiz->module_id)
                            ->select('module_progress.created_at')
                            ->first();

                        if ($moduleProgress && $moduleProgress->created_at && $attempt->submitted_at) {
                            $startedAt = \Carbon\Carbon::parse($moduleProgress->created_at);
                            $submittedAt = \Carbon\Carbon::parse($attempt->submitted_at);
                            $durationSeconds = abs($submittedAt->diffInSeconds($startedAt));
                        } else {
                            $durationSeconds = $attempt->created_at && $attempt->submitted_at
                                ? abs($attempt->submitted_at->diffInSeconds($attempt->created_at))
                                : 0;
                        }
                    }

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
        } else {
            // Global Leaderboard based on Total Correct Answers and Total Time across all passed quizzes
            $attempts = \App\Models\UserQuizAttempt::with(['user:id,name,avatar,role', 'quiz:id,module_id'])
                ->whereNotNull('submitted_at')
                ->where('is_passed', true)
                ->get()
                ->filter(function ($attempt) {
                    return $attempt->user && $attempt->user->role === 'user';
                });

            // Optimasi query untuk correct count
            $attemptIds = $attempts->pluck('id')->toArray();
            $correctCounts = \DB::table('user_answers')
                ->select('attempt_id', \DB::raw('COUNT(*) as total'))
                ->whereIn('attempt_id', $attemptIds)
                ->where('is_correct', true)
                ->groupBy('attempt_id')
                ->pluck('total', 'attempt_id');

            // Optimasi query untuk module progress
            $userIds = $attempts->pluck('user_id')->unique()->toArray();
            $moduleIds = $attempts->map(function($a) { return $a->quiz ? $a->quiz->module_id : null; })->filter()->unique()->toArray();
            
            $moduleProgresses = \DB::table('module_progress')
                ->join('enrollments', 'enrollments.id', '=', 'module_progress.enrollment_id')
                ->whereIn('enrollments.user_id', $userIds)
                ->whereIn('module_progress.module_id', $moduleIds)
                ->select('enrollments.user_id', 'module_progress.module_id', 'module_progress.created_at')
                ->get()
                ->groupBy(function($item) {
                    return $item->user_id . '_' . $item->module_id;
                });

            $userStats = [];

            foreach ($attempts as $attempt) {
                $userId = $attempt->user_id;

                if (!isset($userStats[$userId])) {
                    $userStats[$userId] = [
                        'user' => $attempt->user,
                        'total_score' => 0,
                        'total_duration' => 0,
                    ];
                }

                // Hitung correct count
                $correctCount = $correctCounts[$attempt->id] ?? 0;
                $userStats[$userId]['total_score'] += $correctCount;

                // Hitung durasi
                $durationSeconds = 0;
                if ($attempt->quiz && $attempt->quiz->module_id) {
                    $key = $userId . '_' . $attempt->quiz->module_id;
                    $moduleProgress = isset($moduleProgresses[$key]) ? $moduleProgresses[$key]->first() : null;

                    if ($moduleProgress && $moduleProgress->created_at && $attempt->submitted_at) {
                        $startedAt = \Carbon\Carbon::parse($moduleProgress->created_at);
                        $submittedAt = \Carbon\Carbon::parse($attempt->submitted_at);
                        $durationSeconds = abs($submittedAt->diffInSeconds($startedAt));
                    } else {
                        $durationSeconds = $attempt->created_at && $attempt->submitted_at
                            ? abs($attempt->submitted_at->diffInSeconds($attempt->created_at))
                            : 0;
                    }
                }
                $userStats[$userId]['total_duration'] += $durationSeconds;
            }

            $usersCollection = collect($userStats)->map(function ($stat, $userId) {
                return [
                    'id' => $userId,
                    'user_id' => $userId,
                    'name' => $stat['user']->name,
                    'avatar' => $stat['user']->avatar,
                    'score' => $stat['total_score'],
                    'duration_seconds' => $stat['total_duration'],
                    'is_current_user' => $userId === Auth::id(),
                ];
            });

            // Urutkan collection: score descending, duration_seconds ascending
            $sortedUsers = $usersCollection->sort(function ($a, $b) {
                if ($a['score'] == $b['score']) {
                    return $a['duration_seconds'] <=> $b['duration_seconds'];
                }
                return $b['score'] <=> $a['score'];
            })->values();

            $leaderboardData = $sortedUsers->map(function ($user, $index) use (&$currentUserRank, &$currentUserData) {
                $rank = $index + 1;
                $formattedAttempt = [
                    'rank' => $rank,
                    'user_id' => $user['user_id'],
                    'name' => $user['name'],
                    'avatar' => $user['avatar'],
                    'score' => $user['score'],
                    'duration_seconds' => $user['duration_seconds'],
                    'is_current_user' => $user['is_current_user'],
                ];

                if ($user['is_current_user']) {
                    $currentUserRank = $rank;
                    $currentUserData = $formattedAttempt;
                }

                return $formattedAttempt;
            })->take(50);
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