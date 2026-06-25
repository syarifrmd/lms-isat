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

class CourseController extends Controller
{
    public function __construct(private readonly ModuleProgressService $progressService)
    {
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        
        $search = $request->input('search');
        $category = $request->input('category');
        
        // 1. Tangkap parameter tipe course & divisi khusus admin
        $courseType = $request->input('course_type', 'mandatory');
        $progressStatus = $request->input('progress_status');
        $divisionFilter = $request->input('division'); // Tangkap parameter divisi baru

        $query = Course::with('creator')
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
            
        // 2. FILTER ROLE & DIVISI 
        if (!$user || $user->role !== 'admin') {
            // Selain admin (User Biasa & Trainer), wajib hanya melihat yang sudah 'published'
            $query->where('status', 'published');
            
            // PENGUNCIAN DIVISI MUTLAK: Hanya ambil yang target_division-nya SAMA PERSIS dengan divisi user
            $query->where('target_division', $user->division);
        } else {
            // JIKA ADMIN: Admin bisa memfilter data berdasarkan dropdown divisi yang dipilih di frontend
            if ($divisionFilter && $divisionFilter !== 'all') {
                $query->where('target_division', $divisionFilter);
            }
        }
        
        // 3. FILTER TIPE COURSE (Mandatory vs Non-Mandatory)
        if ($courseType === 'mandatory') {
            $query->where('is_mandatory', true);
        } elseif ($courseType === 'non_mandatory') {
            $query->where('is_mandatory', false);
        }
       
        // 4. FILTER LAINNYA (Search, Category, Progress)
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                  ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        if ($category) {
            $query->where('category', $category);
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

        $courses = $query->orderBy('created_at', 'desc')->get();
        
        $categories = Course::distinct()->whereNotNull('category')->where('category', '!=', '')->pluck('category');
        
        // Ambil data semua divisi unik dari database untuk dikirim ke dropdown Admin
        $divisions = Course::distinct()
            ->whereNotNull('target_division')
            ->where('target_division', '!=', '')
            ->pluck('target_division');
            
        return Inertia::render('Courses/Index', [
            'courses' => $courses,
            'filters' => [
                'search' => $search,
                'category' => $category,
                'course_type' => $courseType,
                'progress_status' => $progressStatus,
                'division' => $divisionFilter, // Kembalikan state filter divisi ke frontend
            ],
            'categories' => $categories,
            'divisions' => $divisions // Lempar data divisi ke frontend
        ]);
    }

    public function create()
    {
        $user = Auth::user();

        if ($user && !in_array($user->role, ['trainer', 'admin'])) {
            abort(403, 'Anda tidak memiliki akses untuk membuat kursus.');
        }

        $categories = Course::distinct()->whereNotNull('category')->where('category', '!=', '')->pluck('category');
        
        // Lempar langsung role & division-nya ke frontend di sini:
        return Inertia::render('Courses/Create', [
            'categories' => $categories,
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

        // Validasi data dasar + Field Timer Baru
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string',
            'is_mandatory' => 'required|boolean',
            // Jika admin wajib diisi, jika trainer boleh kosong dulu karena nanti dipaksa dari backend
            'target_division' => $user->role === 'admin' ? 'required|string' : 'nullable|string', 
            
            // Tambah validasi kolom timer baru
            'is_timer_active' => 'required|boolean',
            'duration_minutes' => 'required_if:is_timer_active,true|nullable|integer|min:1',
        ]);

        // PENGUNCIAN OTOMATIS: Jika bukan admin (berarti Trainer), paksa divisinya sesuai divisi dia
        if ($user->role !== 'admin') {
            $validated['target_division'] = $user->division;
        }

        // Buat course baru
        Course::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'category' => $validated['category'],
            'is_mandatory' => $validated['is_mandatory'],
            'target_division' => $validated['target_division'],
            'created_by'=> $user->id, 
            'status' => $user->role === 'admin' ? 'published' : 'draft', 
            
            // Daftarkan penyimpanan data timer ke database
            'is_timer_active' => $validated['is_timer_active'],
            'duration_minutes' => $validated['is_timer_active'] ? $validated['duration_minutes'] : null,
        ]);

        return redirect()->route('courses.index')->with('success', 'Course berhasil dibuat!');
    }

    public function show($id)
    {
        $userId = Auth::id() ?? 0;

        // Load course dengan modul yang urut berdasarkan sequence
        $course = Course::with(['creator', 'modules' => function($query) {
            $query->orderBy('order_sequence', 'asc');
        }, 'modules.checklistItems', 'modules.quizzes' => function($query) {
            
            // Regular users only see published quizzes; trainers/admins see all
            $isTrainer = Auth::check() && in_array(Auth::user()->role, ['trainer', 'admin']);
            if (!$isTrainer) {
                $query->where('status', 'published');
            }

            // Ambil pertanyaan beserta jawaban
            $query->with(['questions.answers' => function($ansQ) {
                $ansQ->select('id', 'question_id', 'answer_text');
            }]);

            // Check if quiz is passed by current user and count attempts
            $query->withExists(['attempts as is_passed' => function($q) {
                $q->where('user_id', Auth::id())
                  ->where('is_passed', true);
            }])
            ->withCount(['attempts as attempts_count' => function($q) {
                $q->where('user_id', Auth::id());
            }]);
        }])->findOrFail($id);

        // Menampilkan maksimal 5 soal acak
        foreach ($course->modules as $module) {
            foreach ($module->quizzes as $quiz) {
                if ($quiz->questions && $quiz->questions->isNotEmpty()) {
                    // 1. Acak total seluruh soal yang ada, lalu potong maksimal 5 soal
                    $shuffledQuestions = $quiz->questions
                        ->shuffle($userId) 
                        ->take(5)
                        ->values();

                    // 2. Acak pilihan jawaban di dalam soal
                    foreach ($shuffledQuestions as $question) {
                        if ($question->answers) {
                            $shuffledAnswers = $question->answers->shuffle($userId)->values();
                            $question->setRelation('answers', $shuffledAnswers);
                        }
                    }

                    // 3. Set kembali relasi questions kuis dengan 5 soal terpilih
                    $quiz->setRelation('questions', $shuffledQuestions);
                    
                    // 4. Paksa set property jumlah soal agar dibaca frontend sebagai 5 (atau sesuai jumlah soal yang tersedia jika < 5)
                    $quiz->questions_count = $shuffledQuestions->count();
                } else {
                    // Jika memang kuis tidak punya soal di database
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

        // LOGIKA LOCKING MODULE
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

            // Set Status untuk Frontend
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
            
            // Set Lock Status
            $module->is_locked = !$previousModuleCompleted && !$isTrainer;
            $previousModuleCompleted = $moduleState['is_completed'];
        }

        return Inertia::render('Courses/Show', [
            'course'       => $course,
            'userProgress' => $enrollment ? $enrollment->progress_percentage : 0,
            'isEnrolled'   => $enrollment ? true : false,
            'ratingData'   => [
                'average'      => $course->ratings()->avg('rating') ? round((float) $course->ratings()->avg('rating'), 1) : null,
                'count'        => $course->ratings()->count(),
                'distribution' => $course->ratings()->selectRaw('rating, count(*) as total')->groupBy('rating')->orderByDesc('rating')->pluck('total', 'rating'),
                'user_rating'  => Auth::check() ? CourseRating::where('course_id', $id)->where('user_id', Auth::id())->first(['rating', 'review']) : null,
            ],
        ]);
    }
    
    public function edit(Course $course)
    {
        $user = Auth::user();

        // Trainer can only edit their own courses; admin can edit all
        if ($user->role === 'trainer' && $course->created_by !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        $course->load(['modules' => function ($q) {
            $q->orderBy('order_sequence', 'asc');
        }]);

        $categories = Course::distinct()->whereNotNull('category')->where('category', '!=', '')->pluck('category');

        return Inertia::render('Courses/Edit', [
            'course' => $course,
            'categories' => $categories
        ]);
    }

    public function update(Request $request, Course $course)
    {
        $user = Auth::user();

        // Trainer hanya bisa edit course miliknya sendiri; admin bisa edit semua
        if ($user->role === 'trainer' && $course->created_by !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        // VALIDASI PROTEKSI AWAL KHUSUS TRAINER SAAT EDIT:
        // Jika rolenya Trainer tapi kolom division di databasenya kosong/null, tolak proses update.
        if ($user && $user->role === 'trainer' && empty($user->division)) {
            return redirect()->back()->withErrors([
                'title' => 'Gagal mengupdate! Akun Trainer Anda belum memiliki divisi (Division kosong).'
            ]);
        }

        $request->validate([
            'title'        => 'required|string|max:255',
            'description'  => 'nullable|string',
            'category'     => 'nullable|string',
            'status'       => 'required|in:draft,published,archived',
            'cover_image'  => 'nullable|image|max:2048',
            'start_date'   => 'nullable|date',
            'end_date'     => 'nullable|date|after_or_equal:start_date',
            'is_mandatory' => 'required|boolean', 
            
            // Tambah validasi kolom timer baru saat edit/update
            'is_timer_active' => 'required|boolean',
            'duration_minutes' => 'required_if:is_timer_active,true|nullable|integer|min:1',
        ]);

        $updateData = [
            'title'        => $request->title,
            'description'  => $request->description,
            'category'     => $request->category,
            'status'       => $request->status,
            'start_date'   => $request->start_date,
            'end_date'     => $request->end_date,
            'is_mandatory' => $request->is_mandatory, // Ikut diperbarui saat edit
            
            // Masukkan data timer ke array update
            'is_timer_active' => $request->is_timer_active,
            'duration_minutes' => $request->is_timer_active ? $request->duration_minutes : null,
        ];

        // Proteksi tambahan: jika yang mengedit adalah trainer, pastikan target_division terkunci ke divisinya
        if ($user->role === 'trainer') {
            $updateData['target_division'] = $user->division;
        }

        if ($request->hasFile('cover_image')) {
            // Hapus cover lama jika ada
            if ($course->cover_url) {
                $oldPath = str_replace('/storage/', '', $course->cover_url);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('cover_image')->store('covers', 'public');
            $updateData['cover_url'] = Storage::url($path);
        }

        $course->update($updateData);

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
}