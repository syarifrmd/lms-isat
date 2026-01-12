<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\Answer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AssessmentsController extends Controller
{
    /**
     * Display a listing of trainer's courses for assessment management.
     */
    public function index()
    {
        $userId = Auth::id();
        
        $courses = Course::where('created_by', $userId)
            ->withCount('quizzes')
            ->with(['quizzes' => function($query) {
                $query->select('id', 'course_id', 'title', 'passing_score');
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Assessments/Index', [
            'courses' => $courses,
        ]);
    }

    /**
     * Display quizzes for a specific course.
     */
    public function quizzes($courseId)
    {
        // Debugging 404 issue
        \Log::info("AssessmentsController@quizzes hit with ID: " . $courseId);

        $course = Course::find($courseId);

        if (!$course) {
            \Log::error("Course not found in DB: " . $courseId);
            abort(404, 'Course not found in DB with ID: ' . $courseId);
        }

        // Verify trainer owns this course
        if ($course->created_by !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $quizzes = Quiz::where('course_id', $course->id)
            ->withCount('questions')
            ->with(['module:id,title'])
            ->get();

        return Inertia::render('Assessments/QuizList', [
            'course' => $course,
            'quizzes' => $quizzes,
        ]);
    }

    /**
     * Show the form for creating a new quiz.
     */
    public function create($courseId)
    {
        \Log::info("AssessmentsController@create HIT. ID: {$courseId}");

        $course = Course::find($courseId);
        if (!$course) {
            \Log::error("AssessmentsController@create - Course not found: {$courseId}");
            abort(404, 'Course not found in DB');
        }

        // Verify trainer owns this course
        \Log::info("Checking ownership. User: " . Auth::id() . ", Creator: " . $course->created_by);
        if ($course->created_by !== Auth::id()) {
            \Log::warning("Unauthorized access to create quiz. User: " . Auth::id());
            abort(403, 'Unauthorized action.');
        }

        // Get course modules for optional linking
        $modules = $course->modules()->select('id', 'title', 'order_sequence')->get();

        return Inertia::render('Assessments/CreateQuiz', [
            'course' => $course,
            'modules' => $modules,
        ]);
    }

    /**
     * Store a newly created quiz with questions and answers.
     */
    public function store(Request $request, $courseId)
    {
        $course = Course::find($courseId);
        if (!$course) {
            abort(404, 'Course not found');
        }

        // Verify trainer owns this course
        if ($course->created_by !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'module_id' => 'nullable|exists:modules,id',
            'passing_score' => 'required|integer|min:0|max:100',
            'min_score' => 'integer|min:0|max:100',
            'is_timed' => 'boolean',
            'time_limit_second' => 'nullable|integer|min:1',
            'xp_bonus' => 'nullable|numeric|min:0',
            'questions' => 'required|array|min:1',
            'questions.*.question_text' => 'required|string',
            'questions.*.explanation' => 'nullable|string',
            'questions.*.point' => 'required|numeric|min:0',
            'questions.*.answers' => 'required|array|min:2|max:4',
            'questions.*.answers.*.answer_text' => 'required|string',
            'questions.*.answers.*.is_correct' => 'required|boolean',
        ]);

        // Validate module belongs to course if provided
        if (!empty($request->module_id)) {
            $moduleExists = $course->modules()->where('id', $request->module_id)->exists();
            if (!$moduleExists) {
                return back()->withErrors(['module_id' => 'Module does not belong to this course.']);
            }
        }

        // Validate each question has exactly one correct answer
        foreach ($validated['questions'] as $index => $question) {
            $correctCount = collect($question['answers'])->where('is_correct', true)->count();
            if ($correctCount !== 1) {
                return back()->withErrors([
                    "questions.{$index}.answers" => "Each question must have exactly one correct answer."
                ]);
            }
        }

        DB::beginTransaction();
        try {
            // Create quiz
            $quiz = Quiz::create([
                'course_id' => $course->id,
                'module_id' => !empty($request->module_id) ? $request->module_id : null,
                'title' => $validated['title'],
                'passing_score' => $validated['passing_score'],
                'min_score' => $validated['min_score'] ?? 0,
                'is_timed' => $validated['is_timed'] ?? false,
                'time_limit_second' => $validated['time_limit_second'],
                'xp_bonus' => $validated['xp_bonus'],
            ]);

            // Create questions and answers
            foreach ($validated['questions'] as $questionData) {
                $question = Question::create([
                    'quiz_id' => $quiz->id,
                    'question_text' => $questionData['question_text'],
                    'explanation' => $questionData['explanation'],
                    'point' => $questionData['point'],
                ]);

                foreach ($questionData['answers'] as $answerData) {
                    Answer::create([
                        'question_id' => $question->id,
                        'answer_text' => $answerData['answer_text'],
                        'is_correct' => $answerData['is_correct'],
                    ]);
                }
            }

            DB::commit();

            return redirect()
                ->route('assessments.quizzes', ['course' => $course->id])
                ->with('success', 'Quiz created successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to create quiz: ' . $e->getMessage()]);
        }
    }

    /**
     * Show the form for editing the specified quiz.
     */
    public function edit(Quiz $quiz)
    {
        // Verify trainer owns the course
        if ($quiz->course->created_by !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $quiz->load(['questions.answers', 'module:id,title']);
        $modules = $quiz->course->modules()->select('id', 'title', 'order_sequence')->get();

        return Inertia::render('Assessments/EditQuiz', [
            'quiz' => $quiz,
            'course' => $quiz->course,
            'modules' => $modules,
        ]);
    }

    /**
     * Update the specified quiz.
     */
    public function update(Request $request, Quiz $quiz)
    {
        // Verify trainer owns the course
        if ($quiz->course->created_by !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'module_id' => 'nullable|exists:modules,id',
            'passing_score' => 'required|integer|min:0|max:100',
            'min_score' => 'integer|min:0|max:100',
            'is_timed' => 'boolean',
            'time_limit_second' => 'nullable|integer|min:1',
            'xp_bonus' => 'nullable|numeric|min:0',
            'questions' => 'required|array|min:1',
            'questions.*.id' => 'nullable|exists:questions,id',
            'questions.*.question_text' => 'required|string',
            'questions.*.explanation' => 'nullable|string',
            'questions.*.point' => 'required|numeric|min:0',
            'questions.*.answers' => 'required|array|min:2|max:4',
            'questions.*.answers.*.id' => 'nullable|exists:answers,id',
            'questions.*.answers.*.answer_text' => 'required|string',
            'questions.*.answers.*.is_correct' => 'required|boolean',
        ]);

        // Validate module belongs to course if provided
        if ($request->module_id) {
            $moduleExists = $quiz->course->modules()->where('id', $request->module_id)->exists();
            if (!$moduleExists) {
                return back()->withErrors(['module_id' => 'Module does not belong to this course.']);
            }
        }

        // Validate each question has exactly one correct answer
        foreach ($validated['questions'] as $index => $question) {
            $correctCount = collect($question['answers'])->where('is_correct', true)->count();
            if ($correctCount !== 1) {
                return back()->withErrors([
                    "questions.{$index}.answers" => "Each question must have exactly one correct answer."
                ]);
            }
        }

        DB::beginTransaction();
        try {
            // Update quiz
            $quiz->update([
                'module_id' => $request->module_id,
                'title' => $validated['title'],
                'passing_score' => $validated['passing_score'],
                'min_score' => $validated['min_score'] ?? 0,
                'is_timed' => $validated['is_timed'] ?? false,
                'time_limit_second' => $validated['time_limit_second'],
                'xp_bonus' => $validated['xp_bonus'],
            ]);

            // Get existing question IDs
            $existingQuestionIds = $quiz->questions()->pluck('id')->toArray();
            $submittedQuestionIds = collect($validated['questions'])
                ->pluck('id')
                ->filter()
                ->toArray();

            // Delete questions not in submission
            $questionsToDelete = array_diff($existingQuestionIds, $submittedQuestionIds);
            Question::whereIn('id', $questionsToDelete)->delete();

            // Update or create questions and answers
            foreach ($validated['questions'] as $questionData) {
                if (isset($questionData['id'])) {
                    // Update existing question
                    $question = Question::find($questionData['id']);
                    $question->update([
                        'question_text' => $questionData['question_text'],
                        'explanation' => $questionData['explanation'],
                        'point' => $questionData['point'],
                    ]);
                } else {
                    // Create new question
                    $question = Question::create([
                        'quiz_id' => $quiz->id,
                        'question_text' => $questionData['question_text'],
                        'explanation' => $questionData['explanation'],
                        'point' => $questionData['point'],
                    ]);
                }

                // Get existing answer IDs for this question
                $existingAnswerIds = $question->answers()->pluck('id')->toArray();
                $submittedAnswerIds = collect($questionData['answers'])
                    ->pluck('id')
                    ->filter()
                    ->toArray();

                // Delete answers not in submission
                $answersToDelete = array_diff($existingAnswerIds, $submittedAnswerIds);
                Answer::whereIn('id', $answersToDelete)->delete();

                // Update or create answers
                foreach ($questionData['answers'] as $answerData) {
                    if (isset($answerData['id'])) {
                        // Update existing answer
                        Answer::where('id', $answerData['id'])->update([
                            'answer_text' => $answerData['answer_text'],
                            'is_correct' => $answerData['is_correct'],
                        ]);
                    } else {
                        // Create new answer
                        Answer::create([
                            'question_id' => $question->id,
                            'answer_text' => $answerData['answer_text'],
                            'is_correct' => $answerData['is_correct'],
                        ]);
                    }
                }
            }

            DB::commit();

            return redirect()
                ->route('assessments.quizzes', $quiz->course_id)
                ->with('success', 'Quiz updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to update quiz: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified quiz.
     */
    public function destroy(Quiz $quiz)
    {
        // Verify trainer owns the course
        if ($quiz->course->created_by !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $courseId = $quiz->course_id;
        $quiz->delete();

        return redirect()
            ->route('assessments.quizzes', $courseId)
            ->with('success', 'Quiz deleted successfully!');
    }
}
