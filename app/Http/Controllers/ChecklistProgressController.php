<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\ModuleChecklistItem;
use App\Models\ModuleProgress;
use App\Models\Enrollment;
use App\Services\ModuleProgressService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChecklistProgressController extends Controller
{
    public function __construct(private readonly ModuleProgressService $progressService)
    {
    }

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

        // Cek apakah checklist item ini sudah pernah diselesaikan sebelumnya
        $wasAlreadyCompleted = ModuleProgress::where('enrollment_id', $enrollment->id)
            ->where('checklist_item_id', $checklistItemId)
            ->where('is_completed', true)
            ->exists();

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

        // Award XP hanya jika belum pernah diselesaikan sebelumnya
        if (!$wasAlreadyCompleted && $checklistItem->xp_reward > 0) {
            $user->increment('xp', $checklistItem->xp_reward);
        }

        // Update overall enrollment progress
        $this->progressService->recalculateEnrollmentProgress($enrollment);

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

        $this->progressService->recalculateEnrollmentProgress($enrollment);

        return back()->with('success', 'Quiz score recorded');
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
