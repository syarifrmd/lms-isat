<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Module;
use App\Models\ModuleProgress;
use App\Models\UserQuizAttempt;
use App\Services\ModuleProgressService;
use Inertia\Inertia;

class StudentController extends Controller
{
    public function __construct(private readonly ModuleProgressService $progressService)
    {
    }

    /**
     * Daftar semua course untuk dipilih trainer/admin.
     */
    public function index()
    {
        $courses = Course::withCount('enrollments')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'title', 'description', 'category', 'status', 'created_at']);

        return Inertia::render('students/index', [
            'courses' => $courses,
        ]);
    }

    /**
     * Daftar student yang terdaftar di course tertentu.
     */
    public function show($courseId)
    {
        $course = Course::findOrFail($courseId);

        // Load modules with quizzes for this course
        $modules = Module::where('course_id', $courseId)
            ->with('quizzes')
            ->orderBy('order_sequence', 'asc')
            ->get();

        $enrollments = Enrollment::where('course_id', $courseId)
            ->with(['user'])
            ->orderBy('enrollment_at', 'desc')
            ->get()
            ->map(function ($enrollment) use ($modules) {
                // Build per-module progress for this enrollment
                $modulesProgress = $modules->map(function ($module) use ($enrollment) {
                    // Get progress records for this module + enrollment
                    $progresses = ModuleProgress::where('enrollment_id', $enrollment->id)
                        ->where('module_id', $module->id)
                        ->get();

                    $moduleState = $this->progressService->evaluateModule($module, $progresses);

                    // Build quiz results for each quiz in this module
                    $quizResults = $module->quizzes->map(function ($quiz) use ($enrollment) {
                        $attempts = UserQuizAttempt::where('user_id', $enrollment->user_id)
                            ->where('quiz_id', $quiz->id)
                            ->orderBy('submitted_at', 'desc')
                            ->get();

                        $highestScore = $attempts->max('score');
                        $isPassed = $attempts->contains('is_passed', true);
                        $lastAttempt = $attempts->first();

                        return [
                            'quiz_id'         => $quiz->id,
                            'quiz_title'      => $quiz->title,
                            'passing_score'   => (float) ($quiz->passing_score ?? $quiz->min_score ?? 0),
                            'attempts_count'  => $attempts->count(),
                            'is_passed'       => $isPassed,
                            'highest_score'   => $highestScore !== null ? (float) $highestScore : null,
                            'last_attempt_at' => $lastAttempt?->submitted_at?->format('d M Y H:i'),
                        ];
                    })->values()->toArray();

                    return [
                        'module_id'        => $module->id,
                        'module_title'     => $module->title,
                        'order_sequence'   => $module->order_sequence,
                        'has_video'        => !empty($module->video_url),
                        'has_text'         => !empty(trim(strip_tags($module->content_text ?? ''))),
                        'has_document'     => !empty($module->doc_url),
                        'is_video_watched' => $moduleState['is_video_watched'],
                        'is_text_read'     => $moduleState['is_text_read'],
                        'is_document_read' => $moduleState['is_document_read'],
                        'is_completed'     => $moduleState['is_completed'],
                        'quizzes'          => $quizResults,
                    ];
                })->values()->toArray();

                return [
                    'user_id'             => $enrollment->user_id,
                    'name'                => $enrollment->user?->name ?? '-',
                    'email'               => $enrollment->user?->email ?? '-',
                    'region'              => $enrollment->user?->region ?? '-',
                    'employee_id'         => $enrollment->user?->id ?? '-',
                    'status'              => $enrollment->status,
                    'progress_percentage' => (float) ($enrollment->progress_percentage ?? 0),
                    'enrollment_at'       => $enrollment->enrollment_at?->format('d M Y'),
                    'completed_at'        => $enrollment->completed_at?->format('d M Y'),
                    'modules_progress'    => $modulesProgress,
                ];
            });

        return Inertia::render('students/show', [
            'course'      => $course->only('id', 'title', 'description', 'category', 'status'),
            'enrollments' => $enrollments,
        ]);
    }
}
