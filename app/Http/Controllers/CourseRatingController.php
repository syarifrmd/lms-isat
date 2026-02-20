<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseRating;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CourseRatingController extends Controller
{
    /**
     * Store or update the authenticated user's rating for a course.
     * Only enrolled users may rate.
     */
    public function store(Request $request, Course $course)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string|max:1000',
        ]);

        // Must be enrolled
        $enrolled = Enrollment::where('user_id', Auth::id())
            ->where('course_id', $course->id)
            ->exists();

        if (!$enrolled) {
            return back()->withErrors(['rating' => 'You must be enrolled to rate this course.']);
        }

        CourseRating::updateOrCreate(
            ['course_id' => $course->id, 'user_id' => Auth::id()],
            ['rating' => $request->rating, 'review' => $request->review]
        );

        return back()->with('success', 'Rating submitted successfully.');
    }

    /**
     * Delete the authenticated user's rating for a course.
     */
    public function destroy(Course $course)
    {
        CourseRating::where('course_id', $course->id)
            ->where('user_id', Auth::id())
            ->delete();

        return back()->with('success', 'Rating removed.');
    }
}
