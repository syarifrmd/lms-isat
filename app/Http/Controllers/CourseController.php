<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseRating;
use App\Models\Module;
use App\Models\Enrollment; 
use App\Models\ModuleProgress; 
use App\Services\ModuleProgressService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CourseController extends Controller
{
    public function __construct(private readonly ModuleProgressService $progressService)
    {
    }

    /**
     * Rapikan ulang nomor "position" pada satu divisi agar selalu berurutan
     * rapat mulai dari 1 (1,2,3,...) tanpa celah/lompatan, tanpa mengubah
     * urutan relatif antar course yang sudah ada. Dipanggil setiap kali ada
     * insert/delete di course_division supaya nomor tidak terus membengkak.
     */
    private function normalizeDivisionPositions(string $division): void
    {
        $rows = DB::table('course_division')
            ->where('target_division', $division)
            ->orderBy('position')
            ->orderBy('id')
            ->get(['id', 'position']);

        $expected = 1;
        foreach ($rows as $row) {
            if ((int) $row->position !== $expected) {
                DB::table('course_division')->where('id', $row->id)->update(['position' => $expected]);
            }
            $expected++;
        }
    }

    /**
     * Hitung position + prerequisite_course_id untuk satu (course, divisi)
     * berdasarkan input dari form. Mendukung mode:
     * - posisi kosong  => otomatis ditaruh di urutan paling akhir divisi tsb
     * - posisi diisi   => manual, course lain yang bentrok akan digeser +1
     * - gembok 'auto'  => otomatis mengikuti course di posisi sebelumnya (chain)
     * - gembok 'none'  => sengaja TANPA gembok walau bukan posisi pertama
     * - gembok <id>    => gembok eksplisit ke course tertentu di divisi yang sama
     */
    private function resolveDivisionPositionAndPrerequisite(
        string $division,
        ?int $currentCourseId,
        $rawPosition,
        $rawPrerequisite,
        bool $isMandatory
    ): array {
        if (!$isMandatory) {
            return [1, null];
        }

        $manualPosition = ($rawPosition !== null && $rawPosition !== '') ? (int) $rawPosition : null;

        if ($manualPosition !== null) {
            $position = max(1, $manualPosition);

            // Geser course lain di divisi yang sama yang sudah menempati
            // posisi >= posisi baru, supaya tidak ada 2 course posisi sama.
            DB::table('course_division')
                ->where('target_division', $division)
                ->where('position', '>=', $position)
                ->when($currentCourseId, fn ($q) => $q->where('course_id', '!=', $currentCourseId))
                ->increment('position');
        } else {
            // Otomatis: taruh di urutan paling akhir divisi ini.
            $maxPosition = DB::table('course_division')
                ->where('target_division', $division)
                ->when($currentCourseId, fn ($q) => $q->where('course_id', '!=', $currentCourseId))
                ->max('position');
            $position = ((int) $maxPosition) + 1;
        }

        if ($rawPrerequisite === 'none') {
            // Sengaja tanpa gembok meskipun posisinya bukan yang pertama.
            $prerequisiteCourseId = null;
        } elseif ($rawPrerequisite === 'auto' || $rawPrerequisite === null || $rawPrerequisite === '') {
            $prerequisiteCourseId = null;
            if ($position > 1) {
                $previousCoursePivot = DB::table('course_division')
                    ->where('position', $position - 1)
                    ->where('target_division', $division)
                    ->when($currentCourseId, fn ($q) => $q->where('course_id', '!=', $currentCourseId))
                    ->first();

                if ($previousCoursePivot) {
                    $prerequisiteCourseId = $previousCoursePivot->course_id;
                }
            }
        } else {
            // Gembok eksplisit ke course tertentu (relasi bebas, tidak harus berurutan).
            $prerequisiteCourseId = (int) $rawPrerequisite;
        }

        return [$position, $prerequisiteCourseId];
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        
        $search = $request->input('search');
        $category = $request->input('category');
        // Dropdown Mandatory/Non-Mandatory sudah dihapus di frontend, course_type dikunci permanen ke 'mandatory'
        $courseType = 'mandatory';
        $progressStatus = $request->input('progress_status');
        $divisionFilter = $request->input('division'); 
        $journeyId = $request->input('journey_id');

    
        config()->set('database.connections.mysql.strict', false);
        DB::reconnect();
    

        $query = Course::with('creator')
            ->leftJoin('course_division', 'courses.id', '=', 'course_division.course_id')
            ->select(
                'courses.*', 
                DB::raw("GROUP_CONCAT(DISTINCT course_division.target_division SEPARATOR ', ') as target_division"), 
                DB::raw("MAX(course_division.position) as position"), 
                DB::raw("MAX(course_division.prerequisite_course_id) as prerequisite_course_id")
            )
            ->groupBy('courses.id')
            ->withExists(['enrollments as is_enrolled' => function ($query) {
                $query->where('user_id', Auth::id())
                    ->whereIn('status', ['enrolled', 'in_progress']);
            }])
            ->withExists(['enrollments as is_completed' => function ($query) {
                $query->where('user_id', Auth::id())
                    ->where(function ($q) {
                        $q->where('status', 'completed')
                            ->orWhereNotNull('completed_at');
                    });
            }]);
                
        if ($user && $user->role === 'admin') {
            if ($divisionFilter && $divisionFilter !== 'all') {
                $query->where('course_division.target_division', $divisionFilter);
            }
        } elseif ($user && $user->role === 'trainer') {
            $query->where(function ($q) use ($user) {
                $q->where('course_division.target_division', $user->division)
                  ->orWhereNull('course_division.target_division');
            })
            ->where(function ($q) use ($user) {
                $q->where('courses.status', 'published')
                  ->orWhere('courses.created_by', $user->id);
            });
        } else {
            $query->where('courses.status', 'published')
                  ->where('course_division.target_division', $user->division);
        }
        
        // Hanya course mandatory yang ditampilkan (filter non-mandatory sudah tidak diperlukan)
        $query->where('courses.is_mandatory', true);
       
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('courses.title', 'like', '%' . $search . '%')
                  ->orWhere('courses.description', 'like', '%' . $search . '%');
            });
        }

        if ($category) {
            $query->where('courses.category', $category);
        }

        if ($journeyId) {
            $query->where('courses.journey_id', $journeyId);
        }

        if ($progressStatus === 'ongoing') {
            $query->whereHas('enrollments', function ($q) {
                $q->where('user_id', Auth::id())
                    ->whereIn('status', ['enrolled', 'in_progress']);
            });
        } elseif ($progressStatus === 'completed') {
            $query->whereHas('enrollments', function ($q) {
                $q->where('user_id', Auth::id())
                    ->where(function ($q2) {
                        $q2->where('status', 'completed')
                            ->orWhereNotNull('completed_at');
                    });
            });
        } elseif ($progressStatus === 'not_enrolled') {
            $query->whereDoesntHave('enrollments', function ($q) {
                $q->where('user_id', Auth::id());
            });
        }

        $courses = $query->orderByRaw('CASE WHEN course_division.position IS NULL THEN 1 ELSE 0 END, course_division.position asc')
                         ->orderBy('courses.created_at', 'desc')
                         ->paginate(9)
                         ->withQueryString();
        
        $isTrainerOrAdmin = $user && in_array($user->role, ['trainer', 'admin']);
        $userEnrollments = Auth::check() 
            ? Enrollment::where('user_id', $user->id)->get()->keyBy('course_id') 
            : collect();

        foreach ($courses as $course) {
            $isLocked = false;
            if (!$isTrainerOrAdmin && $course->prerequisite_course_id) {
                $prereqEnrollment = $userEnrollments->get($course->prerequisite_course_id);
                if (!$prereqEnrollment || $prereqEnrollment->status !== 'completed') {
                    $isLocked = true;
                }
            }
            $course->is_locked = $isLocked;
        }
        
        $categories = Course::distinct()->whereNotNull('category')->where('category', '!=', '')->pluck('category');
        
        $divisions = DB::table('course_division')->distinct()
            ->whereNotNull('target_division')
            ->where('target_division', '!=', '')
            ->pluck('target_division');

        // Total modul yang ada di seluruh course yang tergabung dalam journey ini
        $totalModules = 0;
        if ($journeyId) {
            $courseIdsInJourney = Course::where('journey_id', $journeyId)->pluck('id');
            $totalModules = Module::whereIn('course_id', $courseIdsInJourney)->count();
        }
            
        return Inertia::render('Courses/Index', [
            'courses' => $courses,
            'filters' => [
                'search' => $search,
                'category' => $category,
                'course_type' => $courseType,
                'progress_status' => $progressStatus,
                'division' => $divisionFilter, 
                'journey_id' => $journeyId,
            ],
            'categories' => $categories,
            'divisions' => $divisions,
            'totalModules' => $totalModules,
        ]);
    }

    public function create()
    {
        $user = Auth::user();

        if ($user && !in_array($user->role, ['trainer', 'admin'])) {
            abort(403, 'Anda tidak memiliki akses untuk membuat kursus.');
        }

        $categories = Course::distinct()->whereNotNull('category')->where('category', '!=', '')->pluck('category');
        
        $mandatoryCourses = Course::join('course_division', 'courses.id', '=', 'course_division.course_id')
            ->where('courses.is_mandatory', true)
            ->get(['courses.id', 'courses.title', 'course_division.position', 'course_division.target_division', 'course_division.prerequisite_course_id']);
        
        $journeys = \App\Models\Journey::select('id', 'title')->get();

        $divisions = DB::table('course_division')->distinct()
            ->whereNotNull('target_division')
            ->where('target_division', '!=', '')
            ->pluck('target_division');

        return Inertia::render('Courses/Create', [
            'categories' => $categories,
            'mandatoryCourses' => $mandatoryCourses, 
            'journeys' => $journeys,
            'divisions' => $divisions,
            'auth' => [
                'user' => [
                    'role'     => $user->role,
                    'division' => $user->division,
                ]
            ]
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string',
            'is_mandatory' => 'required|boolean',
            'target_division' => $user->role === 'admin' ? 'required|array' : 'nullable|array', 
            'is_timer_active' => 'required|boolean',
            'duration_minutes' => 'required_if:is_timer_active,true|nullable|integer|min:1',
            'position' => 'nullable|array',
            'prerequisite_course_id' => 'nullable',
            'prerequisite_course_id.*' => 'nullable|string',
            'journey_id' => 'required|exists:journeys,id',
        ]);

        $isMandatory = $request->boolean('is_mandatory');
        $isTimerActive = $request->boolean('is_timer_active');

        $targetDivisions = $user->role === 'admin' ? $request->input('target_division', []) : [$user->division];

        $coverPath = null;
        if ($request->hasFile('cover_image')) {
            $coverPath = $request->file('cover_image')->store('covers', 'public');
        }

        $course = Course::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'category' => $validated['category'],
            'created_by' => $user->id, 
            'journey_id' => $request->input('journey_id'),
            'status' => $request->input('status', 'draft'), 
            'is_mandatory' => $isMandatory,
            'is_timer_active' => $isTimerActive,
            'duration_minutes' => $isTimerActive ? (int)$validated['duration_minutes'] : 0,
            'cover_url' => $coverPath ? Storage::url($coverPath) : null,
            'start_date' => $request->input('start_date'),
            'end_date' => $request->input('end_date'),
        ]);

        $positionsMap = $request->input('position', []);
        $prerequisiteMap = $request->input('prerequisite_course_id', []);
        if (!is_array($prerequisiteMap)) {
            // Backward compatibility: kalau masih dikirim sebagai 1 nilai tunggal (bukan per divisi)
            $singleValue = $prerequisiteMap;
            $prerequisiteMap = [];
            foreach ($targetDivisions as $division) {
                $prerequisiteMap[$division] = $singleValue;
            }
        }

        foreach ($targetDivisions as $division) {
            [$position, $prerequisiteCourseId] = $this->resolveDivisionPositionAndPrerequisite(
                $division,
                $course->id,
                $positionsMap[$division] ?? null,
                $prerequisiteMap[$division] ?? 'auto',
                $isMandatory
            );

            DB::table('course_division')->insert([
                'course_id' => $course->id,
                'target_division' => $division,
                'position' => $position,
                'prerequisite_course_id' => $prerequisiteCourseId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Rapikan ulang nomor urutan tiap divisi yang terpengaruh agar tetap 1,2,3,... rapat.
        foreach (array_unique($targetDivisions) as $division) {
            $this->normalizeDivisionPositions($division);
        }

        return redirect()->route('courses.index')->with('success', 'Course berhasil dibuat!');
    }

    public function show($id)
    {
        $userId = Auth::id() ?? 0;

        // Disable strict mode for grouping
        config()->set('database.connections.mysql.strict', false);
        \Illuminate\Support\Facades\DB::reconnect();

        $course = Course::withAvg('ratings as average_rating', 'rating')
            ->leftJoin('course_division', 'courses.id', '=', 'course_division.course_id')
            ->select(
                'courses.*', 
                DB::raw("GROUP_CONCAT(DISTINCT course_division.target_division SEPARATOR ', ') as target_division"),
                DB::raw("MAX(course_division.position) as position"), 
                DB::raw("MAX(course_division.prerequisite_course_id) as prerequisite_course_id")
            )
            ->groupBy('courses.id')
            ->withCount('ratings')
            ->with(['creator', 'modules' => function($query) {
                $query->orderBy('order_sequence', 'asc');
            }, 'modules.checklistItems', 'modules.quizzes' => function($query) {
                $isTrainer = Auth::check() && in_array(Auth::user()->role, ['trainer', 'admin']);
                if (!$isTrainer) {
                    $query->where('status', 'published');
                }

                $query->with(['questions.answers' => function($ansQ) {
                    $ansQ->select('id', 'question_id', 'answer_text');
                }]);

                $query->withExists(['attempts as is_passed' => function($q) {
                    $q->where('user_id', Auth::id())
                      ->where('is_passed', true);
                }])
                ->withCount(['attempts as attempts_count' => function($q) {
                    $q->where('user_id', Auth::id());
                }]);
            }])->findOrFail($id);

        foreach ($course->modules as $module) {
            foreach ($module->quizzes as $quiz) {
                if ($quiz->questions && $quiz->questions->isNotEmpty()) {
                    $shuffledQuestions = $quiz->questions
                        ->shuffle($userId) 
                        ->take(5)
                        ->values();

                    foreach ($shuffledQuestions as $question) {
                        if ($question->answers) {
                            $shuffledAnswers = $question->answers->shuffle($userId)->values();
                            $question->setRelation('answers', $shuffledAnswers);
                        }
                    }

                    $quiz->setRelation('questions', $shuffledQuestions);
                    $quiz->questions_count = $shuffledQuestions->count();
                } else {
                    $quiz->questions_count = 0;
                }
            }
        }

        $enrollment = null;
        if (Auth::check()) {
            $enrollment = Enrollment::where('user_id', Auth::id())
                ->where('course_id', $id)
                ->first();
        }

        $previousModuleCompleted = true; 
        $isTrainer = Auth::check() && in_array(Auth::user()->role, ['trainer', 'admin']);

        foreach ($course->modules as $module) {
            $progresses = collect();
            if ($enrollment) {
                $progresses = ModuleProgress::where('enrollment_id', $enrollment->id)
                    ->where('module_id', $module->id)
                    ->get();
            }

            $moduleState = $this->progressService->evaluateModule($module, $progresses);

            $module->is_completed = $moduleState['is_completed'];
            $module->is_text_read = $moduleState['is_text_read'];
            $module->is_video_watched = $moduleState['is_video_watched'];
            $module->is_document_read = $moduleState['is_document_read'];
            $module->is_quiz_passed = $moduleState['is_quiz_passed'];
            
            $docProgress = $progresses->first();
            $module->doc_current_page = $docProgress ? (int) $docProgress->doc_current_page : 0;
            
            $docTotalPages = 0;
            if ($docProgress && $docProgress->doc_total_pages > 0) {
                $docTotalPages = (int) $docProgress->doc_total_pages;
            } else {
                $docUrl = $module->doc_url;
                if ($docUrl && preg_match('/\.pptx$/i', $docUrl)) {
                    $filePath = null;
                    if (str_starts_with($docUrl, '/storage/')) {
                        $filePath = storage_path('app/public/' . str_replace('/storage/', '', $docUrl));
                    }
                    if ($filePath && file_exists($filePath) && class_exists('\ZipArchive')) {
                        $zip = new \ZipArchive();
                        if ($zip->open($filePath) === true) {
                            $slideCount = 0;
                            for ($i = 0; $i < $zip->numFiles; $i++) {
                                $entryName = $zip->getNameIndex($i);
                                if (preg_match('/^ppt\/slides\/slide\d+\.xml$/i', $entryName)) {
                                    $slideCount++;
                                }
                            }
                            $zip->close();
                            if ($slideCount > 0) {
                                $docTotalPages = $slideCount;
                            }
                        }
                    }
                }
            }
            $module->doc_total_pages = $docTotalPages;
            
            $module->is_locked = !$previousModuleCompleted && !$isTrainer;
            $previousModuleCompleted = $moduleState['is_completed'];
        }

        // PENTING: jangan pakai $course->prerequisite_course_id (hasil MAX() agregat
        // dari semua divisi) untuk cek gembok. Course bisa punya gembok BERBEDA di
        // tiap divisi, jadi kita ambil baris course_division milik divisi user yang
        // sedang membuka course ini secara spesifik.
        $viewerDivision = Auth::check() ? Auth::user()->division : null;

        $myDivisionPivot = null;
        if ($viewerDivision) {
            $myDivisionPivot = DB::table('course_division')
                ->where('course_id', $id)
                ->where('target_division', $viewerDivision)
                ->first();
        }
        // Fallback (mis. admin/trainer tanpa divisi cocok, atau untuk keperluan tampilan
        // referensi saja): pakai baris posisi paling awal. Ini tidak mempengaruhi status
        // terkunci siswa biasa karena $isTrainer sudah men-skip pengecekan di bawah, dan
        // siswa selalu punya divisi yang match dengan course yang tampil untuknya.
        if (!$myDivisionPivot) {
            $myDivisionPivot = DB::table('course_division')
                ->where('course_id', $id)
                ->orderBy('position')
                ->first();
        }

        $isLockedByPrerequisite = false;
        $prerequisiteCourseTitle = '';

        if (!$isTrainer && $myDivisionPivot && $myDivisionPivot->prerequisite_course_id) {
            $prerequisite = Course::find($myDivisionPivot->prerequisite_course_id);
            if ($prerequisite) {
                $prerequisiteCourseTitle = $prerequisite->title;
                $prereqEnrollment = Enrollment::where('user_id', Auth::id())
                    ->where('course_id', $prerequisite->id)
                    ->first();

                if (!$prereqEnrollment || $prereqEnrollment->status !== 'completed') {
                    $isLockedByPrerequisite = true;
                }
            }
        }

        return Inertia::render('Courses/Show', [
            'course'                  => $course,
            'userProgress'            => $enrollment ? $enrollment->progress_percentage : 0,
            'isEnrolled'              => $enrollment ? true : false,
            'isLockedByPrerequisite'  => $isLockedByPrerequisite,   
            'prerequisiteCourseTitle' => $prerequisiteCourseTitle, 
            'ratingData'   => [
                'average'      => $course->average_rating ? round((float) $course->average_rating, 1) : null,
                'count'        => $course->ratings_count,
                'distribution' => $course->ratings()->selectRaw('rating, count(*) as total')->groupBy('rating')->orderByDesc('rating')->pluck('total', 'rating'),
                'user_rating'  => Auth::check() ? CourseRating::where('course_id', $id)->where('user_id', Auth::id())->first(['rating', 'review']) : null,
            ],
        ]);
    }

    public function edit(Course $course)
    {
        $user = Auth::user();

        if ($user->role === 'trainer' && $course->created_by !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        $pivotRecords = DB::table('course_division')->where('course_id', $course->id)->get();
        
        $targetDivisions = $pivotRecords->pluck('target_division')->toArray();
        $positionsMap = [];
        $prerequisiteMap = [];
        foreach ($pivotRecords as $rec) {
            $positionsMap[$rec->target_division] = $rec->position;
            // 'none' = sengaja tanpa gembok, tersimpan eksplisit per divisi (bukan agregat global)
            $prerequisiteMap[$rec->target_division] = $rec->prerequisite_course_id ? (string) $rec->prerequisite_course_id : 'none';
        }

        $course->target_division = $targetDivisions;
        $course->position = $positionsMap;
        $course->prerequisite_course_id = $prerequisiteMap;

        $course->load(['modules' => function ($q) {
            $q->orderBy('order_sequence', 'asc'); 
        }]);

        $categories = Course::distinct()->whereNotNull('category')->where('category', '!=', '')->pluck('category');
        
        $mandatoryCourses = Course::join('course_division', 'courses.id', '=', 'course_division.course_id')
            ->where('courses.is_mandatory', true)
            ->where('courses.id', '!=', $course->id)
            ->get(['courses.id', 'courses.title', 'course_division.position', 'course_division.target_division', 'course_division.prerequisite_course_id']);

        $journeys = \App\Models\Journey::select('id', 'title')->get();

        $divisions = DB::table('course_division')->distinct()
            ->whereNotNull('target_division')
            ->where('target_division', '!=', '')
            ->pluck('target_division');

        return Inertia::render('Courses/Edit', [
            'course' => $course,
            'categories' => $categories,
            'mandatoryCourses' => $mandatoryCourses, 
            'journeys' => $journeys,
            'divisions' => $divisions,
        ]);
    }

    public function update(Request $request, Course $course)
    {
        $user = Auth::user();

        if ($user->role === 'trainer' && $course->created_by !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        if ($user && $user->role === 'trainer' && empty($user->division)) {
            return redirect()->back()->withErrors([
                'title' => 'Gagal mengupdate! Akun Trainer Anda belum memiliki divisi (Division kosong).'
            ]);
        }

        $request->validate([
            'title'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'category'         => 'nullable|string',
            'status'           => 'required|in:draft,published,archived',
            'cover_image'      => 'nullable|image|max:2048',
            'start_date'       => 'nullable|date',
            'end_date'         => 'nullable|date|after_or_equal:start_date',
            'is_mandatory'     => 'required|boolean', 
            'is_timer_active'  => 'required|boolean',
            'duration_minutes' => 'required_if:is_timer_active,true|nullable|integer|min:1',
            'target_division'  => 'nullable|array',
            'position'         => 'nullable|array',
            'prerequisite_course_id' => 'nullable',
            'prerequisite_course_id.*' => 'nullable|string',
            'journey_id'       => 'required|exists:journeys,id',
        ]);

        $isMandatory = $request->boolean('is_mandatory');
        $isTimerActive = $request->boolean('is_timer_active');

        $targetDivisions = $user->role === 'admin' ? $request->input('target_division', []) : [$user->division];

        $updateData = [
            'title'                  => $request->title,
            'description'            => $request->description,
            'category'               => $request->category,
            'status'                 => $request->status,
            'start_date'             => $request->start_date,
            'end_date'               => $request->end_date,
            'journey_id'             => $request->journey_id,
            'is_mandatory'           => $isMandatory, 
            'is_timer_active'        => $isTimerActive,
            'duration_minutes'       => $isTimerActive ? (int)$request->duration_minutes : 0,
        ];

        if ($request->hasFile('cover_image')) {
            if ($course->cover_url) {
                $oldPath = str_replace('/storage/', '', $course->cover_url);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('cover_image')->store('covers', 'public');
            $updateData['cover_url'] = Storage::url($path);
        }

        $course->update($updateData);

        // Simpan daftar divisi lama supaya nomor urutannya bisa dirapikan lagi
        // setelah baris lama dihapus (mencegah celah/lompatan nomor).
        $oldDivisions = DB::table('course_division')
            ->where('course_id', $course->id)
            ->pluck('target_division')
            ->unique()
            ->toArray();

        DB::table('course_division')->where('course_id', $course->id)->delete();

        $positionsMap = $request->input('position', []);
        $prerequisiteMap = $request->input('prerequisite_course_id', []);
        if (!is_array($prerequisiteMap)) {
            // Backward compatibility: kalau masih dikirim sebagai 1 nilai tunggal (bukan per divisi)
            $singleValue = $prerequisiteMap;
            $prerequisiteMap = [];
            foreach ($targetDivisions as $division) {
                $prerequisiteMap[$division] = $singleValue;
            }
        }

        foreach ($targetDivisions as $division) {
            [$position, $prerequisiteCourseId] = $this->resolveDivisionPositionAndPrerequisite(
                $division,
                $course->id,
                $positionsMap[$division] ?? null,
                $prerequisiteMap[$division] ?? 'auto',
                $isMandatory
            );

            DB::table('course_division')->insert([
                'course_id' => $course->id,
                'target_division' => $division,
                'position' => $position,
                'prerequisite_course_id' => $prerequisiteCourseId,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        // Rapikan ulang nomor urutan untuk semua divisi yang terpengaruh
        // (baik yang lama ditinggalkan maupun yang baru dipakai).
        foreach (array_unique(array_merge($oldDivisions, $targetDivisions)) as $division) {
            $this->normalizeDivisionPositions($division);
        }

        return redirect()->route('courses.edit', $course->id)
            ->with('success', 'Course updated successfully.');
    }

    public function destroy(Course $course)
    {
        $user = Auth::user();

        if ($user->role !== 'admin' && $course->created_by !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        $course->delete(); 

        return redirect()->route('courses.index')->with('success', 'Course deleted successfully.');
    }

    public function reorderModules(Request $request, $courseId)
    {
        $request->validate([
            'modules' => 'required|array',
            'modules.*.id' => 'required|exists:modules,id',
            'modules.*.order_sequence' => 'required|integer',
        ]);

        foreach ($request->input('modules') as $moduleData) {
            Module::where('id', $moduleData['id'])
                  ->where('course_id', $courseId) 
                  ->update(['order_sequence' => $moduleData['order_sequence']]);
        }

        return back()->with('success', 'Urutan modul berhasil diperbarui.');
    }

    public function reorderCourses(Request $request)
    {
        $user = Auth::user();

        if ($user && !in_array($user->role, ['admin', 'trainer'])) {
            abort(403, 'Anda tidak memiliki akses untuk mengatur urutan kursus.');
        }

        $request->validate([
            'courses' => 'required|array',
            'courses.*.id' => 'required|exists:courses,id',
            'courses.*.position' => 'required|integer',
        ]);

        foreach ($request->input('courses') as $courseData) {
            DB::table('course_division')
                ->where('course_id', $courseData['id'])
                ->update(['position' => $courseData['position']]);
        }

        return redirect()->back()->with('success', 'Urutan posisi kursus berhasil diperbarui!');
    }

    public function getStudentCourses(Request $request)
    {
        $user = Auth::user();
        $userDivision = $user->division; 

        $mandatoryCourses = Course::query()
            ->join('course_division', 'courses.id', '=', 'course_division.course_id')
            ->select('courses.*', 'course_division.position', 'course_division.target_division')
            ->where('courses.status', 'published') 
            ->where('courses.is_mandatory', true)  
            ->where('course_division.target_division', $userDivision)
            ->orderBy('course_division.position', 'asc') 
            ->get();

        return inertia('Student/Dashboard', [
            'mandatoryCourses' => $mandatoryCourses
        ]);
    }
}