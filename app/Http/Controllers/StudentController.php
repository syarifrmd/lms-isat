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
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function __construct(private readonly ModuleProgressService $progressService)
    {
    }

    public function index(Request $request)
    {
        $user = Auth::user();

        $divisionSummary = $this->buildDivisionSummary($user);

        return Inertia::render('students/index', [
            'summary' => $divisionSummary['summary'],
            'summaryCourses' => $divisionSummary['courses'],
        ]);
    }

   
    public function show($courseId)
    {
        $course = Course::findOrFail($courseId);
        $user = Auth::user();

        $visibleDivisions = $this->visibleDivisionsFor($user->division ?? '');

        if ($user->role !== 'admin') {
            $hasAccess = Course::leftJoin('course_division', 'courses.id', '=', 'course_division.course_id')
                ->where('courses.id', $courseId)
                ->where(function ($q) use ($user, $visibleDivisions) {
                    $q->where('courses.created_by', $user->id)
                      ->orWhere(function ($q2) use ($user, $visibleDivisions) {
                          if ($user->role === 'trainer') {
                              $q2->where('courses.status', 'published')
                                 ->where(function ($q3) use ($visibleDivisions) {
                                     $q3->whereIn('course_division.target_division', $visibleDivisions)
                                        ->orWhereNull('course_division.target_division');
                                 });
                          } else {
                              $q2->where('courses.status', 'published')
                                 ->whereIn('course_division.target_division', $visibleDivisions);
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

        $enrollmentsQuery = Enrollment::where('course_id', $courseId)
            ->with(['user'])
            ->orderBy('enrollment_at', 'desc');


        $this->scopeEnrollmentsToVisibleUsers($enrollmentsQuery, $user);

        $enrollments = $enrollmentsQuery->get();

        $students = $enrollments->map(function ($enrollment) use ($modules) {
            // Aggregate failure counts for this user across all quizzes in this course
            $allAttempts = UserQuizAttempt::withTrashed()
                ->where('user_id', $enrollment->user_id)
                ->where('course_id', $enrollment->course_id)
                ->get();

            $scoreFailed = $allAttempts->where('is_passed', false)->where('is_time_up', false)->count();
            $timeFailed = $allAttempts->where('is_time_up', true)->count();

            // Build per-module progress for this enrollment
            $modulesProgress = $modules->map(function ($module) use ($enrollment, $allAttempts) {
                // Get progress records for this module + enrollment
                $progresses = ModuleProgress::where('enrollment_id', $enrollment->id)
                    ->where('module_id', $module->id)
                    ->get();

                $moduleState = $this->progressService->evaluateModule($module, $progresses);

                // Build quiz results for each quiz in this module
                $quizResults = $module->quizzes->map(function ($quiz) use ($enrollment, $allAttempts) {
                    $quizAttempts = $allAttempts->where('quiz_id', $quiz->id);

                    $activeAttempts = $quizAttempts->whereNull('deleted_at');
                    $highestScore = $activeAttempts->max('score');
                    $isPassed = $activeAttempts->contains('is_passed', true);
                    $lastAttempt = $activeAttempts->sortByDesc('submitted_at')->first();

                    // Failure breakdown per quiz (including soft-deleted)
                    $failedScore = $quizAttempts->where('is_passed', false)->where('is_time_up', false)->count();
                    $failedTime = $quizAttempts->where('is_time_up', true)->count();

                    return [
                        'quiz_id'           => $quiz->id,
                        'quiz_title'        => $quiz->title,
                        'passing_score'     => (float) ($quiz->passing_score ?? $quiz->min_score ?? 0),
                        'attempts_count'    => $activeAttempts->count(),
                        'is_passed'         => $isPassed,
                        'highest_score'     => $highestScore !== null ? (float) $highestScore : null,
                        'last_attempt_at'   => $lastAttempt?->submitted_at?->format('d M Y H:i'),
                        'failed_score_count' => $failedScore,
                        'failed_time_count'  => $failedTime,
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
                'branch'              => $enrollment->user?->branch ?? '-',
                'micro_cluster'       => $enrollment->user?->micro_cluster ?? '-',
                'employee_id'         => $enrollment->user?->id ?? '-',
                'status'              => $enrollment->status,
                'progress_percentage' => (float) ($enrollment->progress_percentage ?? 0),
                'enrollment_at'       => $enrollment->enrollment_at?->format('d M Y'),
                'completed_at'        => $enrollment->completed_at?->format('d M Y'),
                'modules_progress'    => $modulesProgress,
                'score_failed_count'  => $scoreFailed,
                'time_failed_count'   => $timeFailed,
            ];
        });

        
        $divisionsTree = [];

        foreach ($visibleDivisions as $divName) {
            $divisionsTree[$divName] = [];
        }

        foreach ($students as $s) {
            $div = $s['division'] ?: 'Tanpa Divisi';
            $divisionsTree[$div][] = $s;
        }

        $groups = [];
        foreach ($divisionsTree as $divName => $divStudents) {
            $branchesTree = [];
            foreach ($divStudents as $s) {
                $branch = $s['branch'] ?: 'Tanpa Branch';
                $branchesTree[$branch][] = $s;
            }

            $branches = [];
            foreach ($branchesTree as $branchName => $branchStudents) {
                $mcTree = [];
                foreach ($branchStudents as $s) {
                    $mc = $s['micro_cluster'] ?: 'Tanpa Micro Cluster';
                    $mcTree[$mc][] = $s;
                }

                $microClusters = [];
                foreach ($mcTree as $mcName => $mcStudents) {
                    $microClusters[] = [
                        'name'     => $mcName,
                        'students' => array_values($mcStudents),
                    ];
                }

                $branches[] = [
                    'name'           => $branchName,
                    'micro_clusters' => $microClusters,
                    'student_count'  => count($branchStudents),
                ];
            }

            $groups[] = [
                'name'          => $divName,
                'branches'      => $branches,
                'student_count' => count($divStudents),
            ];
        }

       
        $totalEnrollments = $students->count();
        $totalCompleted = $students->filter(fn($s) => !is_null($s['completed_at']))->count();

        return Inertia::render('students/show', [
            'course'      => $course->only('id', 'title', 'description', 'category', 'status'),
            'groups'      => $groups,
            'total_enrollments' => $totalEnrollments,
            'total_completed' => $totalCompleted,
        ]);
    }

    private function buildDivisionSummary($user): array
    {
       
        $visibleDivisions = $this->visibleDivisionsFor($user->division ?? '');

    
        $courseQuery = Course::leftJoin('course_division', 'courses.id', '=', 'course_division.course_id')
            ->select('courses.id', 'courses.title', 'courses.is_mandatory')
            ->distinct();

        if ($user->role === 'trainer') {
            $courseQuery->where(function ($q) use ($visibleDivisions) {
                $q->whereIn('course_division.target_division', $visibleDivisions)
                  ->orWhereNull('course_division.target_division');
            })->where(function ($q) use ($user) {
                $q->where('courses.status', 'published')
                  ->orWhere('courses.created_by', $user->id);
            });
        } elseif ($user->role !== 'admin') {
            $courseQuery->where('courses.status', 'published')
                ->whereIn('course_division.target_division', $visibleDivisions);
        }

        $courses = $courseQuery
            ->orderByDesc('courses.is_mandatory')
            ->orderBy('courses.title')
            ->get();
        $courseIds = $courses->pluck('id');

        
        $enrollmentsQuery = Enrollment::whereIn('course_id', $courseIds)
            ->with(['user:id,name,division,branch,micro_cluster', 'course:id,title']);

        
        $this->scopeEnrollmentsToVisibleUsers($enrollmentsQuery, $user);

        $enrollments = $enrollmentsQuery->get();

        
        $tree = [];

       
        foreach ($visibleDivisions as $divName) {
            $tree[$divName] = ['branches' => []];
        }

        foreach ($enrollments as $enrollment) {
            $u = $enrollment->user;
            if (!$u) {
                continue;
            }

            $division     = $u->division ?: 'Tanpa Divisi';
            $branch       = $u->branch ?: 'Tanpa Branch';
            $microCluster = $u->micro_cluster ?: 'Tanpa Micro Cluster';
            $courseId     = $enrollment->course_id;
            $courseTitle  = $enrollment->course->title ?? '-';
            $isCompleted  = !is_null($enrollment->completed_at);

            if (!isset($tree[$division])) {
                $tree[$division] = ['branches' => []];
            }
            if (!isset($tree[$division]['branches'][$branch])) {
                $tree[$division]['branches'][$branch] = ['micro_clusters' => []];
            }
            if (!isset($tree[$division]['branches'][$branch]['micro_clusters'][$microCluster])) {
                $tree[$division]['branches'][$branch]['micro_clusters'][$microCluster] = ['courses' => []];
            }

            $bucket = &$tree[$division]['branches'][$branch]['micro_clusters'][$microCluster]['courses'];
            if (!isset($bucket[$courseId])) {
                $bucket[$courseId] = ['title' => $courseTitle, 'enrolled' => 0, 'completed' => 0];
            }
            $bucket[$courseId]['enrolled']++;
            if ($isCompleted) {
                $bucket[$courseId]['completed']++;
            }
            unset($bucket);
        }

       
        foreach ($tree as $divKey => &$divData) {
            foreach ($divData['branches'] as $branchKey => &$branchData) {
                $branchCourses = [];
                foreach ($branchData['micro_clusters'] as $mcData) {
                    foreach ($mcData['courses'] as $cid => $cData) {
                        if (!isset($branchCourses[$cid])) {
                            $branchCourses[$cid] = ['title' => $cData['title'], 'enrolled' => 0, 'completed' => 0];
                        }
                        $branchCourses[$cid]['enrolled']  += $cData['enrolled'];
                        $branchCourses[$cid]['completed'] += $cData['completed'];
                    }
                }
                $branchData['courses'] = $branchCourses;
            }
            unset($branchData);

            $divCourses = [];
            foreach ($divData['branches'] as $branchData) {
                foreach ($branchData['courses'] as $cid => $cData) {
                    if (!isset($divCourses[$cid])) {
                        $divCourses[$cid] = ['title' => $cData['title'], 'enrolled' => 0, 'completed' => 0];
                    }
                    $divCourses[$cid]['enrolled']  += $cData['enrolled'];
                    $divCourses[$cid]['completed'] += $cData['completed'];
                }
            }
            $divData['courses'] = $divCourses;
        }
        unset($divData);

       
        $formatGroup = function (array $coursesMap) use ($courses) {
            $totalSelesai = 0;
            $finishTotal  = 0;
            $perCourse    = [];

            foreach ($courses as $course) {
                $data = $coursesMap[$course->id] ?? ['enrolled' => 0, 'completed' => 0];
                $totalSelesai += $data['completed'];
                $finishTotal  += $data['enrolled'];

                $perCourse[] = [
                    'course_id'    => $course->id,
                    'course_title' => $course->title,
                    'is_mandatory' => (bool) $course->is_mandatory,
                    'enrolled'     => $data['enrolled'],
                    'finish'       => $data['completed'],
                    'presentase'   => $data['enrolled'] > 0
                        ? round($data['completed'] / $data['enrolled'] * 100, 1)
                        : 0,
                ];
            }

            return [
                'total_selesai'    => $totalSelesai,
                'finish_total'     => $finishTotal,
                'presentase_total' => $finishTotal > 0 ? round($totalSelesai / $finishTotal * 100, 1) : 0,
                'per_course'       => $perCourse,
            ];
        };

        $result = [];
        foreach ($tree as $divKey => $divData) {
            $divisionRow = $formatGroup($divData['courses']);
            $divisionRow['name'] = $divKey;

            $branches = [];
            foreach ($divData['branches'] as $branchKey => $branchData) {
                $branchRow = $formatGroup($branchData['courses']);
                $branchRow['name'] = $branchKey;

                $microClusters = [];
                foreach ($branchData['micro_clusters'] as $mcKey => $mcData) {
                    $mcRow = $formatGroup($mcData['courses']);
                    $mcRow['name'] = $mcKey;
                    $microClusters[] = $mcRow;
                }

                $branchRow['micro_clusters'] = $microClusters;
                $branches[] = $branchRow;
            }

            $divisionRow['branches'] = $branches;
            $result[] = $divisionRow;
        }

        
        $divisionOrder = array_merge(...$this->divisionHierarchy());
        usort($result, function ($a, $b) use ($divisionOrder) {
            $ai = array_search(strtoupper($a['name']), $divisionOrder);
            $bi = array_search(strtoupper($b['name']), $divisionOrder);
            $ai = $ai === false ? 999 : $ai;
            $bi = $bi === false ? 999 : $bi;
            return $ai === $bi ? strcmp($a['name'], $b['name']) : $ai <=> $bi;
        });

        return [
            'summary' => $result,
            'courses' => $courses->map(fn($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'is_mandatory' => (bool) $c->is_mandatory,
            ])->values(),
        ];
    }

    
    private function divisionHierarchy(): array
    {
        return [
            ['HOC'],
            ['HOR'],
            ['HOS'],
            ['BSM'],
            ['CSE', 'RSE'],
            ['DSE'],
        ];
    }

    private function visibleDivisionsFor(?string $division): array
    {
        $division = strtoupper(trim((string) $division));
        $hierarchy = $this->divisionHierarchy();

        foreach ($hierarchy as $index => $levelDivisions) {
            if (in_array($division, $levelDivisions, true)) {
                return array_merge(...array_slice($hierarchy, $index));
            }
        }

        return $division !== '' ? [$division] : [];
    }


    private function scopeEnrollmentsToVisibleUsers($query, $user): void
    {
        if ($user->role === 'admin') {
            return;
        }

        $visibleDivisions = $this->visibleDivisionsFor($user->division ?? '');

        $query->whereHas('user', function ($q) use ($visibleDivisions) {
            $q->whereIn('division', $visibleDivisions);
        });
    }
}