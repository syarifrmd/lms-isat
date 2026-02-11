<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\ModuleChecklistItem;
use App\Models\ModuleProgress;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChecklistProgressController extends Controller
{
    /**
     * Mark a checklist item as completed
     */
    public function markCompleted(Request $request, $checklistItemId)
    {
        $user = Auth::user();
        
        $checklistItem = ModuleChecklistItem::findOrFail($checklistItemId);
        $module = $checklistItem->module;
        
        // Find user's enrollment for this course
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $module->course_id)
            ->firstOrFail();

        // Create or update progress for this checklist item
        $progress = ModuleProgress::updateOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'module_id' => $module->id,
                'checklist_item_id' => $checklistItemId
            ],
            [
                'is_completed' => true,
                'completed_at' => now(),
                // Update specific flags based on checklist type
                'is_video_watched' => $checklistItem->type === 'video' ? true : null,
                'is_text_read' => $checklistItem->type === 'text' ? true : null,
                'is_quiz_passed' => $checklistItem->type === 'quiz' ? true : null,
            ]
        );

        // Update overall enrollment progress
        $this->updateEnrollmentProgress($enrollment);

        return back()->with('success', 'Checklist item marked as completed');
    }

    /**
     * Mark quiz as passed with score
     */
    public function markQuizPassed(Request $request, $checklistItemId)
    {
        $request->validate([
            'score' => 'required|integer|min:0|max:100'
        ]);

        $user = Auth::user();
        $checklistItem = ModuleChecklistItem::findOrFail($checklistItemId);
        $module = $checklistItem->module;
        
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $module->course_id)
            ->firstOrFail();

        $progress = ModuleProgress::updateOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'module_id' => $module->id,
                'checklist_item_id' => $checklistItemId
            ],
            [
                'is_quiz_passed' => $request->score >= 70, // Passing score 70
                'highest_quiz_score' => $request->score,
                'is_completed' => $request->score >= 70,
                'completed_at' => $request->score >= 70 ? now() : null,
            ]
        );

        $this->updateEnrollmentProgress($enrollment);

        return back()->with('success', 'Quiz score recorded');
    }

    /**
     * Calculate and update enrollment progress percentage
     */
    private function updateEnrollmentProgress(Enrollment $enrollment)
    {
        // Get all modules in the course
        $modules = Module::where('course_id', $enrollment->course_id)->get();
        
        $totalChecklists = 0;
        $completedChecklists = 0;

        foreach ($modules as $module) {
            // Get all checklist items for this module
            $checklistItems = $module->checklistItems;
            $count = $checklistItems->count();

            if ($count > 0) {
                $totalChecklists += $count;
    
                foreach ($checklistItems as $item) {
                    $progress = ModuleProgress::where('enrollment_id', $enrollment->id)
                        ->where('checklist_item_id', $item->id)
                        ->where('is_completed', true)
                        ->first();
    
                    if ($progress) {
                        $completedChecklists++;
                    }
                }
            } else {
                 // FALLBACK: Module-based virtual items for consistency
                $hasText = !empty($module->content_text);
                $hasVideo = !empty($module->video_url);

                $prog = ModuleProgress::where('enrollment_id', $enrollment->id)
                            ->where('module_id', $module->id)
                            ->first();

                if ($hasText) {
                    $totalChecklists++;
                    if ($prog && $prog->is_text_read) $completedChecklists++;
                }
                
                if ($hasVideo) {
                    $totalChecklists++;
                    if ($prog && $prog->is_video_watched) $completedChecklists++;
                }
            }
        }

        // Calculate percentage
        $percentage = $totalChecklists > 0 
            ? round(($completedChecklists / $totalChecklists) * 100, 2)
            : 0;

        $enrollment->progress_percentage = $percentage;
        
        // Update status if 100% complete
        if ($percentage >= 100 && $enrollment->status !== 'completed') {
            $enrollment->status = 'completed';
            $enrollment->completed_at = now();
        } elseif ($percentage > 0 && $percentage < 100) {
            $enrollment->status = 'in_progress';
        }
        
        $enrollment->save();
    }

    /**
     * Get checklist progress for a module
     */
    public function getModuleProgress($moduleId)
    {
        $user = Auth::user();
        $module = Module::with('checklistItems')->findOrFail($moduleId);
        
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $module->course_id)
            ->first();

        if (!$enrollment) {
            return response()->json(['error' => 'Not enrolled in this course'], 403);
        }

        $checklistsWithProgress = $module->checklistItems->map(function ($item) use ($enrollment) {
            $progress = ModuleProgress::where('enrollment_id', $enrollment->id)
                ->where('checklist_item_id', $item->id)
                ->first();

            return [
                'id' => $item->id,
                'title' => $item->title,
                'type' => $item->type,
                'description' => $item->description,
                'order_sequence' => $item->order_sequence,
                'xp_reward' => $item->xp_reward,
                'is_completed' => $progress ? $progress->is_completed : false,
                'completed_at' => $progress ? $progress->completed_at : null,
            ];
        });

        return response()->json([
            'module' => $module->only(['id', 'title', 'video_url', 'doc_url', 'content_text']),
            'checklists' => $checklistsWithProgress,
        ]);
    }
}
