<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\Course;
use App\Services\YouTubeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ModuleController extends Controller
{
    protected $youtube;

    public function __construct(YouTubeService $youtube)
    {
        $this->youtube = $youtube;
    }

    public function create($courseId)
    {
        $course = Course::findOrFail($courseId);
        $youtubeConnected = Storage::disk('local')->exists('google-token.json');
        $youtubeVideos = $youtubeConnected ? $this->youtube->listChannelVideos() : [];

        return \Inertia\Inertia::render('Modules/Create', [
            'course' => $course,
            'youtube_connected' => $youtubeConnected,
            'youtube_videos' => $youtubeVideos,
        ]);
    }

    public function edit(Course $course, Module $module)
    {
        $youtubeConnected = Storage::disk('local')->exists('google-token.json');
        $youtubeVideos = $youtubeConnected ? $this->youtube->listChannelVideos() : [];

        return \Inertia\Inertia::render('Modules/Edit', [
            'course' => $course,
            'module' => $module,
            'youtube_connected' => $youtubeConnected,
            'youtube_videos' => $youtubeVideos,
        ]);
    }

    public function channelVideos()
    {
        $youtubeConnected = Storage::disk('local')->exists('google-token.json');
        if (!$youtubeConnected) {
            return response()->json(['error' => 'YouTube not connected'], 403);
        }
        $videos = $this->youtube->listChannelVideos();
        return response()->json($videos);
    }

    private function extractYouTubeId(string $url): ?string
    {
        preg_match('/(?:youtu\.be\/|[?&]v=|\/embed\/)([A-Za-z0-9_-]{11})/', $url, $m);
        return $m[1] ?? (strlen(trim($url)) === 11 ? trim($url) : null);
    }

    public function update(Request $request, Course $course, Module $module)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'video_mode' => 'nullable|in:upload,link,channel',
            'video' => 'nullable|file|mimetypes:video/mp4,video/quicktime|max:5242880', // 5GB limit
            'video_link' => 'nullable|string|max:500',
            'youtube_video_id' => 'nullable|string|max:20',
            'doc_file' => 'nullable|file|max:51200',
            'doc_url' => 'nullable|url',
            'content_text' => 'nullable|string',
        ]);

        $videoMode = $request->input('video_mode', 'upload');

        DB::beginTransaction();

        try {
            $updateData = [
                'title' => $request->title,
                'content_text' => $request->content_text,
                'doc_url' => $request->doc_url,
            ];

            $uploadWarning = null;

            if ($videoMode === 'upload' && $request->hasFile('video')) {
                try {
                    $videoPath = $request->file('video')->path();
                    $videoId = $this->youtube->uploadVideo($videoPath, $request->title, "Uploaded from LMS");
                    if (!$videoId) {
                        $uploadWarning = "Video upload skipped (OAuth2 required).";
                    } else {
                        $updateData['video_url'] = $videoId;
                    }
                } catch (\Exception $uploadError) {
                    $uploadWarning = "Video upload failed: " . $uploadError->getMessage();
                    \Log::error('YouTube upload error: ' . $uploadError->getMessage());
                }
            } elseif ($videoMode === 'link' && $request->filled('video_link')) {
                $videoId = $this->extractYouTubeId($request->input('video_link'));
                if ($videoId) {
                    $updateData['video_url'] = $videoId;
                } else {
                    $uploadWarning = "Could not extract a valid YouTube video ID from the provided link.";
                }
            } elseif ($videoMode === 'channel' && $request->filled('youtube_video_id')) {
                $updateData['video_url'] = $request->input('youtube_video_id');
            }

            // Handle Document Update
            if ($request->hasFile('doc_file')) {
                // Delete old file if exists? (Optional, skipping for now)
                $path = $request->file('doc_file')->store('module_docs', 'public');
                $updateData['doc_url'] = Storage::url($path);
            }

            $module->update($updateData);

            // Sync Checklist Items
            // 1. Video Checklist
            if (!empty($module->video_url)) {
                \App\Models\ModuleChecklistItem::firstOrCreate(
                    ['module_id' => $module->id, 'type' => 'video'],
                    [
                        'title' => 'Watch Video', 
                        'order_sequence' => 1, 
                        'xp_reward' => 10
                    ]
                );
            } else {
                \App\Models\ModuleChecklistItem::where('module_id', $module->id)
                    ->where('type', 'video')
                    ->delete();
            }

            // 2. Text Checklist
            if (!empty($module->content_text)) {
                \App\Models\ModuleChecklistItem::firstOrCreate(
                    ['module_id' => $module->id, 'type' => 'text'],
                    [
                        'title' => 'Read Material', 
                        'order_sequence' => 2, 
                        'xp_reward' => 5
                    ]
                );
            } else {
                \App\Models\ModuleChecklistItem::where('module_id', $module->id)
                    ->where('type', 'text')
                    ->delete();
            }

            DB::commit();

            $message = 'Module updated successfully.';
            if ($uploadWarning) {
                $message .= ' Note: ' . $uploadWarning;
            }

            return redirect()->route('courses.show', $course->id)->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Module update failed: ' . $e->getMessage()]);
        }
    }

    public function store(Request $request, $courseId)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'video_mode' => 'nullable|in:upload,link,channel',
            'video' => 'nullable|file|mimetypes:video/mp4,video/quicktime|max:5242880', // 5GB limit
            'video_link' => 'nullable|string|max:500',
            'youtube_video_id' => 'nullable|string|max:20',
            'doc_file' => 'nullable|file|max:51200', // 50MB
            'doc_url' => 'nullable|url',
            'content_text' => 'nullable|string',
        ]);

        $course = Course::findOrFail($courseId);
        $videoMode = $request->input('video_mode', 'upload');

        DB::beginTransaction();

        try {
            $videoId = null;
            $uploadWarning = null;

            if ($videoMode === 'upload' && $request->hasFile('video')) {
                try {
                    $videoPath = $request->file('video')->path();
                    $videoId = $this->youtube->uploadVideo($videoPath, $request->title, "Uploaded from LMS");
                    if (!$videoId) {
                        $uploadWarning = "Video upload failed. Check logs for details (likely OAuth or SSL issue).";
                        \Log::warning('YouTube upload skipped - Video ID null returned');
                    }
                } catch (\Exception $uploadError) {
                    $uploadWarning = "Video upload failed: " . $uploadError->getMessage();
                    \Log::error('YouTube upload error: ' . $uploadError->getMessage());
                }
            } elseif ($videoMode === 'link' && $request->filled('video_link')) {
                $videoId = $this->extractYouTubeId($request->input('video_link'));
                if (!$videoId) {
                    $uploadWarning = "Could not extract a valid YouTube video ID from the provided link.";
                }
            } elseif ($videoMode === 'channel' && $request->filled('youtube_video_id')) {
                $videoId = $request->input('youtube_video_id');
            }

            // Handle Document
            $docUrl = $request->doc_url;
            if ($request->hasFile('doc_file')) {
                $path = $request->file('doc_file')->store('module_docs', 'public');
                $docUrl = Storage::url($path);
            }

            $maxOrder = $course->modules()->max('order_sequence') ?? 0;

            $module = $course->modules()->create([
                'title' => $request->title,
                'video_url' => $videoId,
                'doc_url' => $docUrl,
                'content_text' => $request->content_text,
                'order_sequence' => $maxOrder + 1,
            ]);

            if ($videoId) {
                $module->checklistItems()->create([
                    'title' => 'Watch Video',
                    'type' => 'video',
                    'order_sequence' => 1,
                    'xp_reward' => 10,
                ]);
            }

            if ($request->content_text) {
                $module->checklistItems()->create([
                    'title' => 'Read Material',
                    'type' => 'text',
                    'order_sequence' => 2,
                    'xp_reward' => 5,
                ]);
            }

            DB::commit();

            $message = 'Module created successfully.';
            if ($uploadWarning) {
                $message .= ' Note: ' . $uploadWarning;
            }

            return redirect()->route('courses.show', $courseId)->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Module creation failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Module creation failed: ' . $e->getMessage()]);
        }
    }
}