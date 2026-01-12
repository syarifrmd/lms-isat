<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Module;
use App\Services\YouTubeService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class CourseController extends Controller
{
    public function index()
    {
        // For admin/trainer showing all or created courses could be logic here.
        // For now showing all published courses + courses created by user if logged in (for trainer view)
        $courses = Course::with('creator')
            ->orderBy('created_at', 'desc')
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
        $course = Course::with([
            'modules' => function ($query) {
                $query->orderBy('order_sequence');
            }, 
            'creator',
            'creator.profile',
            'quizzes' => function ($query) {
                $query->withCount('questions');
            }
        ])->findOrFail($id);

        $user = Auth::user();
        if ($user) {
            $isTrainerOrAdmin = $course->created_by === $user->id || 
                                ($user->profile?->role && in_array($user->profile->role, ['admin', 'trainer']));
            
            if ($isTrainerOrAdmin) {
                 foreach ($course->modules as $module) {
                    $module->is_completed = true;
                    $module->is_locked = false;
                    $module->is_text_read = true;
                 }
            } else {
                 $enrollment = \App\Models\Enrollment::where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->with('moduleProgress')
                    ->first();

                 $previousCompleted = true; // First module is always unlocked
                 
                 foreach ($course->modules as $module) {
                     $progress = $enrollment ? $enrollment->moduleProgress->where('module_id', $module->id)->first() : null;
                     
                     $isTextRead = $progress ? (bool)$progress->is_text_read : false;
                     $isVideoWatched = $progress ? (bool)$progress->is_video_watched : false;

                     // Determine if this module is fully completed
                     // Logic: If it has content, it must be read/watched.
                     // If it has NO content of that type, it's "done" for that type.
                     // Simplification: just trust the progress flags or checked if content exists?
                     // Let's implement robust check:
                     $textDone = !$module->content_text || $isTextRead;
                     $videoDone = !$module->video_url || $isVideoWatched;
                     
                     $isCompleted = $textDone && $videoDone;

                     $module->is_completed = $isCompleted;
                     $module->is_locked = !$previousCompleted;
                     $module->is_text_read = $isTextRead;
                     $module->is_video_watched = $isVideoWatched;

                     if (!$isCompleted) {
                         $previousCompleted = false;
                     }
                 }
            }
        }
        
        return Inertia::render('Courses/Show', [
            'course' => $course
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
