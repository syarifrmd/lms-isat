<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\UserQuizAttempt;
use App\Models\UserAnswer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class QuizController extends Controller
{
    /**
     * Display the quiz for taking.
     */
    public function show(Quiz $quiz)
    {
        // Load questions with answers (but hide correct answer info from users)
        $quiz->load(['questions' => function($query) {
            $query->with(['answers' => function($q) {
                $q->select('id', 'question_id', 'answer_text');
            }]);
        }, 'course']);

        // Check if user has already attempted this quiz
        $previousAttempt = UserQuizAttempt::where('user_id', Auth::id())
            ->where('quiz_id', $quiz->id)
            ->orderBy('created_at', 'desc')
            ->first();

        return Inertia::render('quiz/Take', [
            'quiz' => $quiz,
            'course' => $quiz->course,
            'previousAttempt' => $previousAttempt,
        ]);
    }

    /**
     * Submit quiz answers and calculate score.
     */
    public function submit(Request $request, Quiz $quiz)
    {
        $validated = $request->validate([
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|exists:questions,id',
            'answers.*.answer_id' => 'required|exists:answers,id',
        ]);

        // Verify all answers belong to this quiz
        $questionIds = $quiz->questions()->pluck('id')->toArray();
        foreach ($validated['answers'] as $answer) {
            if (!in_array($answer['question_id'], $questionIds)) {
                return back()->withErrors(['error' => 'Invalid question ID.']);
            }
        }

        DB::beginTransaction();
        try {
            // Load questions with correct answers
            $questions = $quiz->questions()->with('answers')->get();
            
            $totalPoints = $questions->sum('point');
            $earnedPoints = 0;
            $correctCount = 0;

            // Create quiz attempt
            $attempt = UserQuizAttempt::create([
                'user_id' => Auth::id(),
                'quiz_id' => $quiz->id,
                'course_id' => $quiz->course_id,
                'score' => 0, // Will update after calculation
                'is_passed' => false,
                'submitted_at' => now(),
            ]);

            // Process each answer
            foreach ($validated['answers'] as $userAnswer) {
                $question = $questions->firstWhere('id', $userAnswer['question_id']);
                $selectedAnswer = $question->answers->firstWhere('id', $userAnswer['answer_id']);
                
                $isCorrect = $selectedAnswer->is_correct;
                
                if ($isCorrect) {
                    $earnedPoints += $question->point;
                    $correctCount++;
                }

                // Store user answer
                UserAnswer::create([
                    'attempt_id' => $attempt->id,
                    'question_id' => $userAnswer['question_id'],
                    'answer_id' => $userAnswer['answer_id'],
                    'is_correct' => $isCorrect,
                ]);
            }

            // Calculate score as percentage
            $scorePercentage = $totalPoints > 0 ? ($earnedPoints / $totalPoints) * 100 : 0;
            $isPassed = $scorePercentage >= $quiz->passing_score;

            // Update attempt with final score
            $attempt->update([
                'score' => round($scorePercentage, 2),
                'is_passed' => $isPassed,
            ]);

            DB::commit();

            return redirect()
                ->route('quiz.result', $attempt->id)
                ->with('success', 'Quiz submitted successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to submit quiz: ' . $e->getMessage()]);
        }
    }

    /**
     * Display quiz result.
     */
    public function result(UserQuizAttempt $attempt)
    {
        // Verify user owns this attempt
        if ($attempt->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $attempt->load([
            'quiz.questions.answers',
            'userAnswers.question.answers',
            'userAnswers.answer',
            'course',
        ]);

        return Inertia::render('quiz/Result', [
            'attempt' => $attempt,
            'quiz' => $attempt->quiz,
            'course' => $attempt->course,
        ]);
    }
}
