<?php

namespace App\Services;

use App\Models\Enrollment;
use App\Models\Module;
use App\Models\ModuleProgress;
use Illuminate\Support\Collection;

class ModuleProgressService
{
    public function evaluateModule(Module $module, ?Collection $progresses = null): array
    {
        $progresses = $progresses ?? ModuleProgress::where('module_id', $module->id)->get();

        $isTextRead = $progresses->contains(function ($progress) {
            return (bool) $progress->is_text_read;
        });

        $isVideoWatched = $progresses->contains(function ($progress) {
            return (bool) $progress->is_video_watched;
        });

        $isDocumentRead = $progresses->contains(function ($progress) {
            return (bool) $progress->is_document_read;
        });

        $quizRequirementMet = true;
        if ($module->relationLoaded('quizzes')) {
            $quizRequirementMet = $module->quizzes->isEmpty()
                || $module->quizzes->every(fn ($quiz) => (bool) ($quiz->is_passed ?? false));
        }

        $checklistRequirementMet = true;
        if ($module->relationLoaded('checklistItems') && $module->checklistItems->isNotEmpty()) {
            $checklistRequirementMet = $module->checklistItems->every(function ($item) use ($progresses) {
                return $progresses->contains(function ($progress) use ($item) {
                    return $progress->checklist_item_id === $item->id && (bool) $progress->is_completed;
                });
            });
        }

        $textRequirementMet = empty(trim(strip_tags($module->content_text ?? ''))) || $isTextRead;
        $videoRequirementMet = empty($module->video_url) || $isVideoWatched;
        $documentRequirementMet = empty($module->doc_url) || $isDocumentRead;

        $baseCompleted = $textRequirementMet && $videoRequirementMet && $documentRequirementMet && $quizRequirementMet;

        // If module has checklist items, ALL checklists must be completed.
        // Or if it only has base requirements, they must be satisfied.
        return [
            'is_text_read' => $isTextRead,
            'is_video_watched' => $isVideoWatched,
            'is_document_read' => $isDocumentRead,
            'is_quiz_passed' => $quizRequirementMet,
            'is_completed' => $baseCompleted && $checklistRequirementMet,
        ];
    }

    public function recalculateEnrollmentProgress(Enrollment $enrollment): void
    {
        $modules = Module::where('course_id', $enrollment->course_id)
            ->with(['checklistItems'])
            ->get();

        $totalChecklists = 0;
        $completedChecklists = 0;

        foreach ($modules as $module) {
            $progresses = ModuleProgress::where('enrollment_id', $enrollment->id)
                ->where('module_id', $module->id)
                ->get();

            $checklistItems = $module->checklistItems;

            if ($checklistItems->isNotEmpty()) {
                $totalChecklists += $checklistItems->count();

                $completedChecklists += ModuleProgress::where('enrollment_id', $enrollment->id)
                    ->where('module_id', $module->id)
                    ->whereIn('checklist_item_id', $checklistItems->pluck('id'))
                    ->where('is_completed', true)
                    ->count();
            }

            if (!empty($module->content_text) && !$checklistItems->contains(fn ($item) => in_array($item->type, ['text'], true))) {
                $totalChecklists++;
                if ($progresses->contains(fn ($progress) => (bool) $progress->is_text_read)) {
                    $completedChecklists++;
                }
            }

            if (!empty($module->video_url) && !$checklistItems->contains(fn ($item) => in_array($item->type, ['video'], true))) {
                $totalChecklists++;
                if ($progresses->contains(fn ($progress) => (bool) $progress->is_video_watched)) {
                    $completedChecklists++;
                }
            }

            if (!empty($module->doc_url) && !$checklistItems->contains(fn ($item) => in_array($item->type, ['document', 'doc'], true))) {
                $totalChecklists++;
                if ($progresses->contains(fn ($progress) => (bool) $progress->is_document_read)) {
                    $completedChecklists++;
                }
            }
        }

        $percentage = $totalChecklists > 0
            ? round(($completedChecklists / $totalChecklists) * 100, 2)
            : 0;

        $enrollment->progress_percentage = $percentage;

        if ($percentage >= 100 && $enrollment->status !== 'completed') {
            $enrollment->status = 'completed';
            $enrollment->completed_at = now();
        } elseif ($percentage > 0 && $percentage < 100) {
            $enrollment->status = 'in_progress';
        }

        $enrollment->save();
    }
}