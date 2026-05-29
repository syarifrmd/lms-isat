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
        $progressStatus = $request->input('progress_status');

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
            

        // Trainer & admin see all statuses; regular users only see published
        if (!$user || !in_array($user->role, ['trainer', 'admin'])) {
            $query->where('status', 'published');
        }
        
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
            
        return Inertia::render('Courses/Index', [
            'courses' => $courses,
            'filters' => [
                'search' => $search,
                'category' => $category,
                'progress_status' => $progressStatus,
            ],
            'categories' => $categories
        ]);
    }

    public function create()
    {
        $categories = Course::distinct()->whereNotNull('category')->where('category', '!=', '')->pluck('category');
        return Inertia::render('Courses/Create', [
            'categories' => $categories
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string',
            'status' => 'required|in:draft,published,archived',
            'cover_image' => 'nullable|image|max:2048', // 2MB max
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $coverUrl = null;
        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('covers', 'public');
            $coverUrl = Storage::url($path);
        }

        $course = Course::create([
            'title' => $request->title,
            'description' => $request->description,
            'category' => $request->category,
            'status' => $request->status,
            'cover_url' => $coverUrl,
            'created_by' => Auth::id(), 
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
        ]);

        return redirect()->route('courses.show', $course->id)->with('success', 'Course created successfully.');
    }

    public function show($id)
    {
        // Load course dengan modul yang urut berdasarkan sequence
        $course = Course::with(['creator', 'modules' => function($query) {
            $query->orderBy('order_sequence', 'asc');
        }, 'modules.checklistItems', 'modules.quizzes' => function($query) {
            // Regular users only see published quizzes; trainers/admins see all
            $isTrainer = Auth::check() && in_array(Auth::user()->role, ['trainer', 'admin']);
            if (!$isTrainer) {
                $query->where('status', 'published');
            }
            // Check if quiz is passed by current user and count attempts
            $query->withExists(['attempts as is_passed' => function($q) {
                $q->where('user_id', Auth::id())
                  ->where('is_passed', true);
            }])
            ->withCount(['attempts as attempts_count' => function($q) {
                $q->where('user_id', Auth::id());
            }]);
        }])->findOrFail($id);
        
        $enrollment = null;
        if (Auth::check()) {
            $enrollment = Enrollment::where('user_id', Auth::id())
                ->where('course_id', $id)
                ->first();
        }

        

        // LOGIKA LOCKING MODULE
        $previousModuleCompleted = true; // Modul pertama selalu terbuka (seolah modul sebelumnya "selesai")
        
        $isTrainer = Auth::check() && in_array(Auth::user()->role, ['trainer', 'admin']);

        foreach ($course->modules as $module) {
            $progresses = collect();
            
            if ($enrollment) {
                $progresses = ModuleProgress::where('enrollment_id', $enrollment->id)
                    ->where('module_id', $module->id)
                    ->get();
            }

            $moduleState = $this->progressService->evaluateModule($module, $progresses);

            // 2. Set Status untuk Frontend
            $module->is_completed = $moduleState['is_completed'];
            $module->is_text_read = $moduleState['is_text_read'];
            $module->is_video_watched = $moduleState['is_video_watched'];
            $module->is_document_read = $moduleState['is_document_read'];
            $module->is_quiz_passed = $moduleState['is_quiz_passed'];
            
            // Extract doc progress pages
            $docProgress = $progresses->first();
            $module->doc_current_page = $docProgress ? (int) $docProgress->doc_current_page : 0;
            
            $docTotalPages = 0;
            if ($docProgress && $docProgress->doc_total_pages > 0) {
                $docTotalPages = (int) $docProgress->doc_total_pages;
            } else {
                // If it is a PPTX file, dynamically try to extract slide count
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
            
            // 3. Set Lock Status
            // Modul ini terkunci KECUALI modul sebelumnya sudah selesai, atau user adalah trainer
            $module->is_locked = !$previousModuleCompleted && !$isTrainer;

            // Update tracker looping: status modul ini menjadi penentu modul berikutnya
            $previousModuleCompleted = $moduleState['is_completed'];
        }

        return Inertia::render('Courses/Show', [
            'course'       => $course,
            'userProgress' => $enrollment ? $enrollment->progress_percentage : 0,
            'isEnrolled'   => $enrollment ? true : false,
            'ratingData'   => [
                'average'      => $course->ratings()->avg('rating')
                    ? round((float) $course->ratings()->avg('rating'), 1)
                    : null,
                'count'        => $course->ratings()->count(),
                'distribution' => $course->ratings()
                    ->selectRaw('rating, count(*) as total')
                    ->groupBy('rating')
                    ->orderByDesc('rating')
                    ->pluck('total', 'rating'),
                'user_rating'  => Auth::check()
                    ? CourseRating::where('course_id', $id)
                        ->where('user_id', Auth::id())
                        ->first(['rating', 'review'])
                    : null,
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

        // Trainer can only edit their own courses; admin can edit all
        if ($user->role === 'trainer' && $course->created_by !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'category'    => 'nullable|string',
            'status'      => 'required|in:draft,published,archived',
            'cover_image' => 'nullable|image|max:2048',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date|after_or_equal:start_date',
        ]);

        $updateData = [
            'title'       => $request->title,
            'description' => $request->description,
            'category'    => $request->category,
            'status'      => $request->status,
            'start_date'  => $request->start_date,
            'end_date'    => $request->end_date,
        ];

        if ($request->hasFile('cover_image')) {
            // Delete old cover if stored
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

    public function reorderModules(Request $request, Course $course)
    {
        $user = Auth::user();

        if ($user->role === 'trainer' && $course->created_by !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'modules'             => 'required|array',
            'modules.*.id'        => 'required|integer|exists:modules,id',
            'modules.*.order_sequence' => 'required|integer|min:1',
        ]);

        foreach ($request->modules as $item) {
            Module::where('id', $item['id'])
                ->where('course_id', $course->id)
                ->update(['order_sequence' => $item['order_sequence']]);
        }

        return back()->with('success', 'Modules reordered successfully.');
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