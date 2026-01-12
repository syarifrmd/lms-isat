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
            'quizzes' => function ($query) {
                $query->withCount('questions');
            }
        ])->findOrFail($id);
        
        return Inertia::render('Courses/Show', [
            'course' => $course
        ]);
    }
}
