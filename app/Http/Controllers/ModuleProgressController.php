<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\ModuleProgress;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ModuleProgressController extends Controller
{
    public function markTextRead(Request $request, $moduleId)
    {
        $user = Auth::user();
        
        $module = Module::find($moduleId);
        if (!$module) {
            return response()->json(['message' => 'Module not found.'], 404);
        }
        
        // Find enrollment
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $module->course_id)
            ->first();
            
        if (!$enrollment) {
            return response()->json(['message' => 'Enrollment not found found. Please join the course first.'], 404);
        }

        $progress = ModuleProgress::firstOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'module_id' => $moduleId
            ]
        );

        $progress->is_text_read = true;
        // Also ensure default values if it was just created (Laravel usually handles defaults if defined in DB, but explicit is safe)
        if ($progress->wasRecentlyCreated) {
             $progress->is_video_watched = false;
             $progress->is_quiz_passed = false;
             $progress->highest_quiz_score = 0;
        }

        $progress->save();
        
        return response()->json(['success' => true, 'is_text_read' => true]);
    }
}
