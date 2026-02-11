<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\ModuleChecklistItem;
use App\Models\ModuleProgress;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ModuleProgressController extends Controller
{
    public function markTextRead(Request $request, $moduleId)
    {
        $user = Auth::user();
        $module = Module::findOrFail($moduleId);
        
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $module->course_id)
            ->firstOrFail();

        // Cari checklist item tipe 'text' untuk modul ini
        $checklistItem = ModuleChecklistItem::where('module_id', $moduleId)
            ->where('type', 'text')
            ->first();

        if ($checklistItem) {
            // Update progress checklist specific
            ModuleProgress::updateOrCreate(
                [
                    'enrollment_id' => $enrollment->id,
                    'module_id' => $moduleId,
                    'checklist_item_id' => $checklistItem->id
                ],
                [
                    'is_completed' => true,
                    'is_text_read' => true,
                    'completed_at' => now(),
                ]
            );
        } else {
            // Fallback untuk backward compatibility (jika tidak ada checklist item)
            $progress = ModuleProgress::firstOrCreate(
                ['enrollment_id' => $enrollment->id, 'module_id' => $moduleId], // cari row general (checklist_item_id null)
            );
            $progress->is_text_read = true;
            $progress->save();
        }

        $this->updateEnrollmentProgress($enrollment);

        return back()->with('success', 'Module marked as read');
    }

    public function markVideoWatched(Request $request, $moduleId)
    {
        $user = Auth::user();
        $module = Module::findOrFail($moduleId);
        
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $module->course_id)
            ->firstOrFail();

        // Cari checklist item tipe 'video' untuk modul ini
        $checklistItem = ModuleChecklistItem::where('module_id', $moduleId)
            ->where('type', 'video')
            ->first();

        if ($checklistItem) {
            // Update progress checklist specific
            ModuleProgress::updateOrCreate(
                [
                    'enrollment_id' => $enrollment->id,
                    'module_id' => $moduleId,
                    'checklist_item_id' => $checklistItem->id
                ],
                [
                    'is_completed' => true,
                    'is_video_watched' => true,
                    'completed_at' => now(),
                ]
            );
        } else {
             // Fallback
            $progress = ModuleProgress::firstOrCreate(
                ['enrollment_id' => $enrollment->id, 'module_id' => $moduleId]
            );
            $progress->is_video_watched = true;
            $progress->save();
        }

        $this->updateEnrollmentProgress($enrollment); 

        return back()->with('success', 'Video marked as watched');
    }

    /**
     * Menghitung ulang total progress berdasarkan CHECKLIST ITEMS.
     */
    private function updateEnrollmentProgress(Enrollment $enrollment)
    {
        // Get all modules in the course
        $modules = Module::where('course_id', $enrollment->course_id)->with('checklistItems')->get();
        
        $totalChecklists = 0;
        $completedChecklists = 0;

        foreach ($modules as $module) {
            // Hitung item dari tabel checklist items
            $checklistItems = $module->checklistItems;
            $count = $checklistItems->count();
            
            if ($count > 0) {
                $totalChecklists += $count;
                
                // Hitung yang completed
                $completedCount = ModuleProgress::where('enrollment_id', $enrollment->id)
                    ->whereIn('checklist_item_id', $checklistItems->pluck('id'))
                    ->where('is_completed', true)
                    ->count();
                    
                $completedChecklists += $completedCount;
            } else {
                // FALLBACK: Jika modul tidak punya checklist items (data lama/belum dimigrasi full)
                // Kita hitung modul itu sendiri sebagai 1 unit progress
                $totalChecklists++;
                
                // Cek progress general (row dengan checklist_item_id = OLD/NULL) atau logic lama
                $prog = ModuleProgress::where('enrollment_id', $enrollment->id)
                            ->where('module_id', $module->id)
                            ->whereNull('checklist_item_id') // Asumsi data lama checklist_item_id NULL
                            ->first();
                            
                $hasText = !empty($module->content_text);
                $hasVideo = !empty($module->video_url);
                $textDone = !$hasText || ($prog && $prog->is_text_read);
                $videoDone = !$hasVideo || ($prog && $prog->is_video_watched);
                
                if ($textDone && $videoDone) {
                    $completedChecklists++;
                }
            }
        }

        $percent = $totalChecklists > 0 
            ? round(($completedChecklists / $totalChecklists) * 100, 2)
            : 0;

        $enrollment->progress_percentage = $percent;
        
        if ($percent >= 100 && $enrollment->status !== 'completed') {
            $enrollment->status = 'completed';
            $enrollment->completed_at = now();
        } elseif ($percent > 0 && $percent < 100) {
             $enrollment->status = 'in_progress';
        }
        
        $enrollment->save();
    }
}
