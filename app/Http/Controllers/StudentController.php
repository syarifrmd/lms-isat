<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Module;
use App\Models\ModuleProgress;
use App\Models\UserQuizAttempt;
use App\Services\ModuleProgressService;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class StudentController extends Controller
{
    public function __construct(private readonly ModuleProgressService $progressService)
    {
    }

    public function index()
    {
        $user = Auth::user();

        // Disable strict mode for grouping
        config()->set('database.connections.mysql.strict', false);
        \Illuminate\Support\Facades\DB::reconnect();
        
        $query = Course::withCount('enrollments')
            ->leftJoin('course_division', 'courses.id', '=', 'course_division.course_id')
            ->select('courses.id', 'courses.title', 'courses.description', 'courses.category', 'courses.status', 'courses.created_at', 'courses.created_by')
            ->groupBy('courses.id', 'courses.title', 'courses.description', 'courses.category', 'courses.status', 'courses.created_at', 'courses.created_by')
            ->orderBy('courses.created_at', 'desc');
            
        if ($user->role === 'trainer') {
            $query->where(function ($q) use ($user) {
                $q->where('course_division.target_division', $user->division)
                  ->orWhereNull('course_division.target_division');
            })
            ->where(function ($q) use ($user) {
                $q->where('courses.status', 'published')
                  ->orWhere('courses.created_by', $user->id);
            });
        } elseif ($user->role !== 'admin') {
            $query->where('courses.status', 'published')
                  ->where('course_division.target_division', $user->division);
        }

        $courses = $query->get();

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
        $user = Auth::user();
        
        if ($user->role !== 'admin') {
            $hasAccess = Course::leftJoin('course_division', 'courses.id', '=', 'course_division.course_id')
                ->where('courses.id', $courseId)
                ->where(function ($q) use ($user) {
                    $q->where('courses.created_by', $user->id)
                      ->orWhere(function ($q2) use ($user) {
                          if ($user->role === 'trainer') {
                              $q2->where('courses.status', 'published')
                                 ->where(function ($q3) use ($user) {
                                     $q3->where('course_division.target_division', $user->division)
                                        ->orWhereNull('course_division.target_division');
                                 });
                          } else {
                              $q2->where('courses.status', 'published')
                                 ->where('course_division.target_division', $user->division);
                          }
                      });
                })
                ->exists();

            if (!$hasAccess) {
                abort(403, 'Unauthorized access to this course\'s students.');
            }
        }

        // Load modules with quizzes for this course
        $modules = Module::where('course_id', $courseId)
            ->with('quizzes')
            ->orderBy('order_sequence', 'asc')
            ->get();

        $enrollments = Enrollment::where('course_id', $courseId)
            ->with(['user'])
            ->orderBy('enrollment_at', 'desc')
            ->paginate(10);

        $enrollments->getCollection()->transform(function ($enrollment) use ($modules) {
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
                'division'            => $enrollment->user?->division ?? '-',
                'employee_id'         => $enrollment->user?->id ?? '-',
                'status'              => $enrollment->status,
                'progress_percentage' => (float) ($enrollment->progress_percentage ?? 0),
                'enrollment_at'       => $enrollment->enrollment_at?->format('d M Y'),
                'completed_at'        => $enrollment->completed_at?->format('d M Y'),
                'modules_progress'    => $modulesProgress,
            ];
        });

        // Calculate total stats
        $totalEnrollments = Enrollment::where('course_id', $courseId)->count();
        $totalCompleted = Enrollment::where('course_id', $courseId)->whereNotNull('completed_at')->count();

        return Inertia::render('students/show', [
            'course'      => $course->only('id', 'title', 'description', 'category', 'status'),
            'enrollments' => $enrollments,
            'total_enrollments' => $totalEnrollments,
            'total_completed' => $totalCompleted,
        ]);
    }
}
