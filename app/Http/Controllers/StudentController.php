<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use Inertia\Inertia;

class StudentController extends Controller
{
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

        $enrollments = Enrollment::where('course_id', $courseId)
            ->with(['user'])
            ->orderBy('enrollment_at', 'desc')
            ->get()
            ->map(function ($enrollment) {
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
                ];
            });

        return Inertia::render('students/show', [
            'course'      => $course->only('id', 'title', 'description', 'category', 'status'),
            'enrollments' => $enrollments,
        ]);
    }
}
