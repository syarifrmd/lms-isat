<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnrollmentController extends Controller
{
    public function store(Request $request, $courseId)
    {
        $course = Course::findOrFail($courseId);
        $userId = Auth::id();

        // Check if already enrolled
        $existingEnrollment = Enrollment::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->first();

        if ($existingEnrollment) {
            return back()->with('error', 'Anda sudah terdaftar di kursus ini.');
        }

        Enrollment::create([
            'user_id' => $userId,
            'course_id' => $courseId,
            'status' => 'enrolled',
            'progress_percentage' => 0,
            'enrollment_at' => now(),
            
        ]);

        return redirect()->route('courses.show', $courseId)
            ->with('success', 'Berhasil mendaftar di kursus!');
    }

    public function destroy($courseId)
    {
        $userId = Auth::id();

        $enrollment = Enrollment::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->first();

        if (!$enrollment) {
            return back()->with('error', 'Anda tidak terdaftar di kursus ini.');
        }

        $enrollment->delete();

        return redirect()->route('courses.index')
            ->with('success', 'Berhasil keluar dari kursus.');
    }
}
