<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\UserQuizAttempt;
use App\Models\UserAnswer;
use App\Models\Answer;
use App\Models\Enrollment;
use App\Models\ModuleProgress;
use App\Services\ModuleProgressService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class QuizController extends Controller
{
    private function ensureLearnerRole(): void
    {
        if (!Auth::check() || Auth::user()->role !== 'user') {
            abort(403, 'Hanya user yang dapat mengerjakan quiz.');
        }
    }

    public function show(Quiz $quiz)
    {
        $this->ensureLearnerRole();

        $attemptsCount = UserQuizAttempt::where('user_id', Auth::id())
            ->where('quiz_id', $quiz->id)
            ->count();

        $hasPassed = UserQuizAttempt::where('user_id', Auth::id())
            ->where('quiz_id', $quiz->id)
            ->where('is_passed', true)
            ->exists();

        $userId = Auth::id();
        $sessionKey = "quiz_active_questions_" . $quiz->id . "_" . $userId;
        $sessionSeedKey = "quiz_seed_" . $quiz->id . "_" . $userId;

        if (!session()->has($sessionKey)) {
            $seed = mt_rand();
            $randomQuestionIds = $quiz->questions()
                ->inRandomOrder($seed)
                ->take(5)
                ->pluck('id')
                ->toArray();
            session()->put($sessionKey, $randomQuestionIds);
            session()->put($sessionSeedKey, $seed);
        }

        $activeQuestionIds = session()->get($sessionKey);
        $seed = session()->get($sessionSeedKey, mt_rand());

        $quiz->load(['questions' => function($query) use ($activeQuestionIds, $seed) {
            $query->whereIn('id', $activeQuestionIds)
                ->inRandomOrder($seed)
                ->with(['answers' => function($q) use ($seed) {
                    $q->select('id', 'question_id', 'answer_text')->inRandomOrder($seed);
                }]);
        }, 'course']);

        $quiz->setRelation('questions', $quiz->questions->values());

        $previousAttempt = UserQuizAttempt::where('user_id', Auth::id())
            ->where('quiz_id', $quiz->id)
            ->orderBy('created_at', 'desc')
            ->first();

        return Inertia::render('quiz/Take', [
            'quiz' => $quiz,
            'course' => $quiz->course,
            'previousAttempt' => $previousAttempt,
            'attempts_count' => $attemptsCount,
            'has_passed' => $hasPassed,
        ]);
    }

    public function submit(Request $request, Quiz $quiz)
    {
        $this->ensureLearnerRole();

        $attemptsCount = UserQuizAttempt::where('user_id', Auth::id())
            ->where('quiz_id', $quiz->id)
            ->count();

        $lastAttempt = UserQuizAttempt::where('user_id', Auth::id())
            ->where('quiz_id', $quiz->id)
            ->latest()
            ->first();

        if ($attemptsCount >= 3 && (!$lastAttempt || !$lastAttempt->is_passed)) {
            return redirect()->route('courses.show', $quiz->course_id)
                             ->with('error', 'Anda telah mencapai batas maksimal percobaan.');
        }

        if ($lastAttempt && $lastAttempt->is_passed) {
            return redirect()->route('quiz.result', $lastAttempt->id)
                             ->with('error', 'Anda sudah lulus quiz ini.');
        }

        $validated = $request->validate([
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|exists:questions,id',
            'answers.*.answer_id' => 'required|exists:answers,id',
        ]);

        $userId = Auth::id();
        $sessionKey = "quiz_active_questions_" . $quiz->id . "_" . $userId;
        $sessionSeedKey = "quiz_seed_" . $quiz->id . "_" . $userId;
        
        $activeQuestionIds = session()->get($sessionKey, []);
        $seed = session()->get($sessionSeedKey, mt_rand());

        if (empty($activeQuestionIds)) {
            $activeQuestionIds = collect($validated['answers'])->pluck('question_id')->toArray();
        }

        DB::beginTransaction();
        try {
            $questions = $quiz->questions()->whereIn('id', $activeQuestionIds)->with('answers')->get();

            $totalPoints = $questions->sum('point');
            $earnedPoints = 0;

            $attempt = UserQuizAttempt::create([
                'user_id' => Auth::id(),
                'quiz_id' => $quiz->id,
                'course_id' => $quiz->course_id,
                'score' => 0,
                'is_passed' => false,
                'submitted_at' => now(),
            ]);

            $clientAnswers = collect($validated['answers'])->whereIn('question_id', $activeQuestionIds);

            foreach ($clientAnswers as $userAnswer) {
                $question = $questions->firstWhere('id', $userAnswer['question_id']);
                if (!$question) continue;

                $selectedAnswer = $question->answers->firstWhere('id', $userAnswer['answer_id']);
                $isCorrect = $selectedAnswer ? (bool)$selectedAnswer->is_correct : false;

                if ($isCorrect) {
                    $earnedPoints += $question->point;
                }

                UserAnswer::create([
                    'attempt_id' => $attempt->id,
                    'question_id' => $userAnswer['question_id'],
                    'answer_id' => $userAnswer['answer_id'],
                    'is_correct' => $isCorrect,
                ]);
            }

            $scorePercentage = $totalPoints > 0 ? ($earnedPoints / $totalPoints) * 100 : 0;
            $isPassed = $scorePercentage >= $quiz->passing_score;

            $attempt->update([
                'score' => round($scorePercentage, 2),
                'is_passed' => $isPassed,
            ]);
            
            // Hitung ulang attempt_count yang baru
            $currentAttemptsCount = UserQuizAttempt::where('user_id', Auth::id())
                ->where('quiz_id', $quiz->id)
                ->count();

            $enrollment = Enrollment::where('user_id', Auth::id())
                ->where('course_id', $quiz->course_id)
                ->first();

         if ($enrollment) {
    if (!$isPassed && $currentAttemptsCount >= 3) {
        $targetModuleId = $quiz->module_id; 

        if ($targetModuleId) {
            \DB::table('module_progress')
                ->where('enrollment_id', $enrollment->id) 
                ->where('module_id', $targetModuleId)
                ->update([
                    'is_completed' => 0,
                    'is_text_read' => 0,
                    'is_video_watched' => 0,
                    'is_document_read' => 0, 
                    'text_elapsed_seconds' => 0,
                    'text_scroll_percentage' => 0,
                    'video_last_position_seconds' => 0,
                    'video_max_position_seconds' => 0,
                    'doc_current_page' => 1,
                    'completed_at' => null,
                ]);
        }
    }

    // Hitung ulang progress bar utama
    (new ModuleProgressService())->recalculateEnrollmentProgress($enrollment);
}

            // Logika Penambahan XP Bonus jika Lulus
            if ($isPassed && $quiz->xp_bonus > 0) {
                $alreadyPassed = UserQuizAttempt::where('user_id', Auth::id())
                    ->where('quiz_id', $quiz->id)
                    ->where('is_passed', true)
                    ->where('id', '!=', $attempt->id)
                    ->exists();

                if (!$alreadyPassed) {
                    Auth::user()->increment('xp', $quiz->xp_bonus);
                }
            }

            session()->forget($sessionKey);
            session()->forget($sessionSeedKey);

            DB::commit();

            return redirect()
                ->route('quiz.result', ['attempt' => $attempt->id, 'seed' => $seed])
                ->with('success', 'Quiz submitted successfully!');

        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()
                ->route('courses.show', $quiz->course_id)
                ->with('error', 'Sistem Gagal Memproses Jawaban: ' . $e->getMessage());
        }
    }

    public function result(UserQuizAttempt $attempt)
    {
        $this->ensureLearnerRole();

        if ($attempt->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $userId = $attempt->user_id;
        $seed = request()->query('seed', $attempt->id);

        $submittedQuestionIds = UserAnswer::where('attempt_id', $attempt->id)
            ->pluck('question_id')
            ->toArray();

        $attempt->load([
            'quiz.questions' => function($q) use ($submittedQuestionIds, $seed) {
                $q->whereIn('id', $submittedQuestionIds)->inRandomOrder($seed);
            },
            'quiz.questions.answers' => function($q) use ($seed) {
                $q->inRandomOrder($seed);
            },
            'userAnswers.answer',
            'course',
        ]);

        if ($attempt->quiz) {
            $formattedQuestions = $attempt->quiz->questions->values();
            $attempt->quiz->setRelation('questions', $formattedQuestions);
        }

        return Inertia::render('quiz/Result', [
            'attempt' => $attempt,
            'quiz' => $attempt->quiz,
            'course' => $attempt->course,
        ]);
    }
}