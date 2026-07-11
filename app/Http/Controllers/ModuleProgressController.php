<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\ModuleChecklistItem;
use App\Models\ModuleProgress;
use App\Models\Enrollment;
use App\Models\Quiz; 
use App\Models\UserQuizAttempt; 
use App\Services\ModuleProgressService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ModuleProgressController extends Controller
{
    public function __construct(private readonly ModuleProgressService $progressService)
    {
    }

    /**
     * Trigger Pembuka Kunci Kuis Otomatis
     */
  private function checkAndUnlockQuiz($userId, $moduleId)
{
    $quiz = Quiz::where('module_id', $moduleId)->first();

    if ($quiz) {
        $attemptsCount = UserQuizAttempt::where('user_id', $userId)
            ->where('quiz_id', $quiz->id)
            ->count();
        if ($attemptsCount >= 3) {
            UserQuizAttempt::where('user_id', $userId)
                ->where('quiz_id', $quiz->id)
                ->delete();
        }
    }

    return $quiz;
}

    /**
     * Cek apakah kuis pada modul (jika ada) sudah lulus oleh user.
     * Dipakai untuk mengunci dokumen modul sampai kuis lulus.
     */
    private function isModuleQuizPassed($userId, $moduleId): bool
    {
        $quiz = Quiz::where('module_id', $moduleId)->first();

        if (!$quiz) {
            return true;
        }

        return UserQuizAttempt::where('user_id', $userId)
            ->where('quiz_id', $quiz->id)
            ->where('is_passed', true)
            ->exists();
    }

    public function markTextRead(Request $request, $moduleId)
    {
        $user = Auth::user();
        $module = Module::findOrFail($moduleId);

        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $module->course_id)
            ->firstOrFail();

        $request->validate([
            'elapsed_seconds' => 'nullable|numeric|min:0',
            'scroll_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        $checklistItem = ModuleChecklistItem::where('module_id', $moduleId)
            ->where('type', 'text')
            ->first();

        $progress = $this->resolveProgress($enrollment, $module, $checklistItem);
        $progress->text_elapsed_seconds = $request->input('elapsed_seconds');
        $progress->text_scroll_percentage = $request->input('scroll_percentage');

        $unlockedQuiz = null;
        if ($this->shouldCompleteText($module, $request)) {
            $progress->is_text_read = true;
            $progress->is_completed = true;
            $progress->completed_at = $progress->completed_at ?? now();

            // TRIGGER UNLOCK KUIS (BACA TEKS)
            $unlockedQuiz = $this->checkAndUnlockQuiz($user->id, $moduleId);
        }

        $progress->save();

        $this->progressService->recalculateEnrollmentProgress($enrollment);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'progress_percentage' => (float) $enrollment->progress_percentage,
                'is_completed' => (bool) $progress->is_completed,
                'is_text_read' => (bool) $progress->is_text_read,
                'is_video_watched' => (bool) $progress->is_video_watched,
                'is_document_read' => (bool) $progress->is_document_read,
                'unlocked_quiz_id' => $unlockedQuiz?->id,
            ]);
        }

        return back()->with('success', $progress->is_text_read ? 'Module marked as read' : 'Text progress tracked');
    }

    public function markVideoWatched(Request $request, $moduleId)
    {
        $user = Auth::user();
        $module = Module::findOrFail($moduleId);

        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $module->course_id)
            ->firstOrFail();

        $request->validate([
            'current_time_seconds' => 'nullable|numeric|min:0',
            'max_position_seconds' => 'nullable|numeric|min:0',
            'duration_seconds' => 'nullable|numeric|min:0',
        ]);

        $checklistItem = ModuleChecklistItem::where('module_id', $moduleId)
            ->where('type', 'video')
            ->first();

        $progress = $this->resolveProgress($enrollment, $module, $checklistItem);
        $progress->video_last_position_seconds = $request->input('current_time_seconds');
        $progress->video_max_position_seconds = $request->input('max_position_seconds');
        $progress->video_duration_seconds = $request->input('duration_seconds') ?? (($module->duration_minutes ?? 0) * 60);

        $unlockedQuiz = null;
        if ($this->shouldCompleteVideo($module, $request)) {
            $progress->is_video_watched = true;
            $progress->is_completed = true;
            $progress->completed_at = $progress->completed_at ?? now();

            // TRIGGER UNLOCK KUIS (NONTON VIDEO)
            $unlockedQuiz = $this->checkAndUnlockQuiz($user->id, $moduleId);
        }

        $progress->save();

        $this->progressService->recalculateEnrollmentProgress($enrollment);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'progress_percentage' => (float) $enrollment->progress_percentage,
                'is_completed' => (bool) $progress->is_completed,
                'is_text_read' => (bool) $progress->is_text_read,
                'is_video_watched' => (bool) $progress->is_video_watched,
                'is_document_read' => (bool) $progress->is_document_read,
                'unlocked_quiz_id' => $unlockedQuiz?->id,
            ]);
        }

        return back()->with('success', $progress->is_video_watched ? 'Video marked as watched' : 'Video progress tracked');
    }

   public function markDocumentRead(Request $request, $moduleId)
    {
        $user = Auth::user();
        $module = Module::findOrFail($moduleId);

        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $module->course_id)
            ->firstOrFail();

        $request->validate([
            'current_page' => 'required|integer|min:1', 
            'total_pages' => 'required|integer|min:1',   
        ]);

        if (!$this->isModuleQuizPassed($user->id, $moduleId)) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dokumen modul masih terkunci. Selesaikan dan lulus kuis terlebih dahulu.',
                ], 403);
            }

            return back()->with('error', 'Dokumen modul masih terkunci. Selesaikan dan lulus kuis terlebih dahulu.');
        }

        $checklistItem = ModuleChecklistItem::where('module_id', $moduleId)
            ->whereIN('type', ['document', 'doc'])
            ->first();

        $progress = $this->resolveProgress($enrollment, $module, $checklistItem);
        
        $currentPage = (int) $request->input('current_page');
        $totalPages = (int) $request->input('total_pages');

        $progress->doc_current_page = $currentPage;
        $progress->doc_total_pages = $totalPages;

        if ($totalPages > 0 && $currentPage >= $totalPages) {
            $progress->is_document_read = true;
            $progress->is_completed = true;
            $progress->completed_at = $progress->completed_at ?? now();
        }

        $progress->save();

        $this->progressService->recalculateEnrollmentProgress($enrollment);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'progress_percentage' => (float) $enrollment->progress_percentage,
                'is_completed' => (bool) $progress->is_completed,
                'is_text_read' => (bool) $progress->is_text_read,
                'is_video_watched' => (bool) $progress->is_video_watched,
                'is_document_read' => (bool) $progress->is_document_read,
            ]);
        }

        return back()->with('success', $progress->is_document_read ? 'Document marked as read' : 'Document progress tracked');
    }

    /**
     * Catat kegagalan waktu modul (dipanggil dari frontend saat timer modul habis).
     */
    public function handleTimeUp(Request $request, $moduleId)
    {
        $user = Auth::user();
        $module = Module::findOrFail($moduleId);

        // Catatan: waktu modul habis TIDAK menyentuh percobaan kuis sama sekali (tidak menghapus,
        // tidak membuat attempt baru). Timer modul ini mengunci video/teks/dokumen — bukan kuis —
        // jadi habisnya waktu modul semestinya tidak memakai/mereset jatah percobaan kuis user.

        // RESET PROGRES MODUL (video/teks/dokumen) karena waktu modul telah habis,
        // disamakan dengan mekanisme reset kesempatan kuis di atas.
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $module->course_id)
            ->first();

        if ($enrollment) {
            ModuleProgress::where('enrollment_id', $enrollment->id)
                ->where('module_id', $module->id)
                ->update([
                    'is_text_read' => false,
                    'is_video_watched' => false,
                    'is_document_read' => false,
                    'is_completed' => false,
                    'completed_at' => null,
                    'text_elapsed_seconds' => null,
                    'text_scroll_percentage' => null,
                    'video_last_position_seconds' => null,
                    'video_max_position_seconds' => null,
                    'doc_current_page' => null,
                    'doc_total_pages' => null,
                ]);

            $this->progressService->recalculateEnrollmentProgress($enrollment);
        }

        return back()->with('info', 'Waktu modul habis dicatat.');
    }

    private function shouldCompleteText(Module $module, Request $request): bool
    {
        $elapsedSeconds = (float) ($request->input('elapsed_seconds') ?? 0);
        $scrollPercentage = (float) ($request->input('scroll_percentage') ?? 0);

        if ($elapsedSeconds < 15) {
            return false;
        }

        $content = trim(strip_tags($module->content_text ?? ''));

        if ($content !== '' && $scrollPercentage < 99) {
            return false;
        }

        return true;
    }

    private function shouldCompleteVideo(Module $module, Request $request): bool
    {
        $currentTimeSeconds = (float) ($request->input('current_time_seconds') ?? 0);
        $maxPositionSeconds = (float) ($request->input('max_position_seconds') ?? 0);
        $durationSeconds = (float) ($request->input('duration_seconds') ?? (($module->duration_minutes ?? 0) * 60));

        if ($durationSeconds <= 0) {
            return false;
        }

        $thresholdSeconds = max($durationSeconds - 2, 0);

        return $currentTimeSeconds >= $thresholdSeconds && $maxPositionSeconds >= $thresholdSeconds;
    }

    private function resolveProgress(Enrollment $enrollment, Module $module, ?ModuleChecklistItem $checklistItem): ModuleProgress
    {
        return ModuleProgress::firstOrCreate([
            'enrollment_id'     => $enrollment->id,
            'module_id'         => $module->id,
            'checklist_item_id' => $checklistItem?->id,
        ]);
    }
}