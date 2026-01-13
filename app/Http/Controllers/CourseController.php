<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Module;
use App\Models\Enrollment; // Pastikan import ini ada
use App\Models\ModuleProgress; // Pastikan import ini ada
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class CourseController extends Controller
{
    public function index()
    {
        // For admin/trainer showing all or created courses could be logic here.
        // For now showing all published courses + courses created by user if logged in (for trainer view)
        $courses = Course::with('creator.profile')
            ->withExists(['enrollments as is_enrolled' => function ($query) {
                $query->where('user_id', Auth::id());
            }])
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')
            ->latest()
            ->get(); 
            
        return Inertia::render('Courses/Index', [
            'courses' => $courses
        ]);
    }

    public function create()
    {
        return Inertia::render('Courses/Create');
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
        $course = Course::with([
            'creator.profile',
            'modules' => function ($query) {
                $query->orderBy('order_sequence', 'asc')
                      // Pastikan baris ini ada agar data quiz masuk ke modul
                      ->with(['quizzes' => function($q) {
                          $q->withCount('questions');
                      }]);
            },
        ])->findOrFail($id);
        
        $enrollment = null;
        if (Auth::check()) {
            $enrollment = Enrollment::where('user_id', Auth::id())
                ->where('course_id', $id)
                ->first();
        }

        

        // LOGIKA LOCKING MODULE
        $previousModuleCompleted = true; // Modul pertama selalu terbuka (seolah modul sebelumnya "selesai")

        foreach ($course->modules as $module) {
            $progress = null;
            
            if ($enrollment) {
                $progress = ModuleProgress::where('enrollment_id', $enrollment->id)
                    ->where('module_id', $module->id)
                    ->first();
            }

            // 1. Cek User Progress untuk modul ini
            // Kriteria Selesai: Text sudah dibaca (tambah logika video di sini jika perlu)
            $isTextRead = $progress ? $progress->is_text_read : false;
            $isVideoWatched = $progress ? $progress->is_video_watched : false;
            
            // Logika "Completed": Modul selesai jika SEMUA konten yang ada sudah diselesaikan
            $textRequirementMet = empty($module->content_text) || $isTextRead;
            $videoRequirementMet = empty($module->video_url) || $isVideoWatched;

            $isCompleted = $textRequirementMet && $videoRequirementMet;

            // 2. Set Status untuk Frontend
            $module->is_completed = $isCompleted;
            $module->is_text_read = $isTextRead;
            $module->is_video_watched = $isVideoWatched;
            
            // 3. Set Lock Status
            // Modul ini terkunci KECUALI modul sebelumnya sudah selesai
            $module->is_locked = !$previousModuleCompleted;

            // Update tracker looping: status modul ini menjadi penentu modul berikutnya
            $previousModuleCompleted = $isCompleted;
        }

        return Inertia::render('Courses/Show', [
            'course' => $course,
            'userProgress' => $enrollment ? $enrollment->progress_percentage : 0,
            'isEnrolled' => $enrollment ? true : false,
        ]);
    }

    public function destroy(Course $course)
    {
        if ($course->created_by !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $course->delete();

        return redirect()->route('courses.index')->with('success', 'Course deleted successfully.');
    }
}
