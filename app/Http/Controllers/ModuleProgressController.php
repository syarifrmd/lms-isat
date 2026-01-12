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
        
        $module = Module::findOrFail($moduleId);
        
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $module->course_id)
            ->firstOrFail();

        $progress = ModuleProgress::firstOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'module_id' => $moduleId
            ]
        );

        $progress->is_text_read = true;
        // Jika modul ini hanya berisi teks, maka modul dianggap complete
        // Namun, jika punya video, kita harus cek keduanya (ini logika bisa disesuaikan)
        // Untuk sekarang, kita simpan status text read dulu.
        $progress->save();

        // [BARU] Hitung ulang dan update persentase di tabel enrollment
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

        $progress = ModuleProgress::firstOrCreate(
            [ 'enrollment_id' => $enrollment->id, 'module_id' => $moduleId ]
        );

        $progress->is_video_watched = true; 
        $progress->save();

        $this->updateEnrollmentProgress($enrollment); 

        return back()->with('success', 'Video marked as watched');
    }

    /**
     * Menghitung ulang total progress (0-100%) dan menyimpannya ke enrollment.
     */
    private function updateEnrollmentProgress(Enrollment $enrollment)
    {
        // 1. Ambil semua modul
        $modules = Module::where('course_id', $enrollment->course_id)->get();
        $totalModules = $modules->count();

        if ($totalModules === 0) {
            // Fix: Ganti progress jadi progress_percentage
            $enrollment->update([
                'progress_percentage' => 100, 
                'status' => 'completed', 
                'completed_at' => now()
            ]);
            return;
        }

        $completedModulesCount = 0;

        foreach ($modules as $mod) {
            $prog = ModuleProgress::where('enrollment_id', $enrollment->id)
                        ->where('module_id', $mod->id)
                        ->first();

            $hasText = !empty($mod->content_text);
            $hasVideo = !empty($mod->video_url);

            $textDone = !$hasText || ($prog && $prog->is_text_read);
            $videoDone = !$hasVideo || ($prog && $prog->is_video_watched);

            if ($textDone && $videoDone) {
                $completedModulesCount++;
            }
        }

        $percent = round(($completedModulesCount / $totalModules) * 100);

        // Fix: Menggunakan kolom progress_percentage
        $enrollment->progress_percentage = $percent;
        
        if ($percent == 100 && $enrollment->status !== 'completed') {
            $enrollment->status = 'completed';
            $enrollment->completed_at = now();
        }
        
        $enrollment->save();
    }
}
