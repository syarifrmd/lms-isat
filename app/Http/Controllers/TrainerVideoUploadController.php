<?php

namespace App\Http\Controllers;

use App\Services\YouTubeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TrainerVideoUploadController extends Controller
{
    public function __construct(protected YouTubeService $youtube)
    {
    }

    public function create(): Response
    {
        $youtubeConnected = Storage::disk('local')->exists('google-token.json');

        return Inertia::render('trainer/VideoUpload', [
            'youtube_connected' => $youtubeConnected,
            'uploaded_video' => session('uploaded_video'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'video' => ['required', 'file', 'mimetypes:video/mp4,video/quicktime', 'max:5242880'],
        ]);

        if (!Storage::disk('local')->exists('google-token.json')) {
            return back()->withErrors([
                'video' => 'Akun YouTube belum terhubung. Silakan hubungkan YouTube terlebih dahulu.',
            ]);
        }

        try {
            $videoId = $this->youtube->uploadVideo(
                $request->file('video')->path(),
                $request->string('title')->toString(),
                $request->string('description')->toString() ?: 'Uploaded from LMS Trainer'
            );

            if (!$videoId) {
                return back()->withErrors([
                    'video' => 'Upload gagal. Silakan cek koneksi OAuth YouTube dan coba lagi.',
                ]);
            }

            return redirect()
                ->route('trainer.video-upload.create')
                ->with('success', 'Video berhasil diupload ke YouTube.')
                ->with('uploaded_video', [
                    'id' => $videoId,
                    'url' => 'https://www.youtube.com/watch?v=' . $videoId,
                ]);
        } catch (\Throwable $e) {
            \Log::error('Trainer quick video upload failed: ' . $e->getMessage());

            return back()->withErrors([
                'video' => 'Upload video gagal: ' . $e->getMessage(),
            ]);
        }
    }
}
