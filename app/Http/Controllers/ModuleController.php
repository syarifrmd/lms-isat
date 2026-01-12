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

        return \Inertia\Inertia::render('Modules/Create', [
            'course' => $course,
            'youtube_connected' => $youtubeConnected
        ]);
    }

    public function edit(Course $course, Module $module)
    {
        $youtubeConnected = Storage::disk('local')->exists('google-token.json');

        return \Inertia\Inertia::render('Modules/Edit', [
            'course' => $course,
            'module' => $module,
            'youtube_connected' => $youtubeConnected
        ]);
    }

    public function update(Request $request, Course $course, Module $module)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'video' => 'nullable|file|mimetypes:video/mp4,video/quicktime|max:102400',
            'doc_file' => 'nullable|file|max:10240', 
            'doc_url' => 'nullable|url',
            'content_text' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $updateData = [
                'title' => $request->title,
                'content_text' => $request->content_text,
                'doc_url' => $request->doc_url,
            ];

            // Re-Upload Video if provided
            $uploadWarning = null;
            if ($request->hasFile('video')) {
                 try {
                    $videoPath = $request->file('video')->path();
                    $videoTitle = $request->title;
                    $videoId = $this->youtube->uploadVideo($videoPath, $videoTitle, "Uploaded from LMS");
                    
                    if (!$videoId) {
                        $uploadWarning = "Video upload skipped (OAuth2 required).";
                    } else {
                        $updateData['video_url'] = $videoId;
                    }
                } catch (\Exception $uploadError) {
                    $uploadWarning = "Video upload failed: " . $uploadError->getMessage();
                    \Log::error('YouTube upload error: ' . $uploadError->getMessage());
                }
            }

            // Handle Document Update
            if ($request->hasFile('doc_file')) {
                // Delete old file if exists? (Optional, skipping for now)
                $path = $request->file('doc_file')->store('module_docs', 'public');
                $updateData['doc_url'] = Storage::url($path);
            }

            $module->update($updateData);

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
            'video' => 'nullable|file|mimetypes:video/mp4,video/quicktime|max:102400',
            'doc_file' => 'nullable|file|max:10240', // 10MB
            'doc_url' => 'nullable|url',
            'content_text' => 'nullable|string',
        ]);

        $course = Course::findOrFail($courseId);

        DB::beginTransaction();

        try {
            $videoId = null;
            $uploadWarning = null;
            
            // Try to upload video to YouTube if provided
            // Note: YouTube Data API v3 requires OAuth2 for uploads.
            // API key alone is insufficient. Video upload will be skipped unless OAuth is configured.
            if ($request->hasFile('video')) {
                try {
                    $videoPath = $request->file('video')->path();
                    $videoTitle = $request->title;
                    $videoId = $this->youtube->uploadVideo($videoPath, $videoTitle, "Uploaded from LMS");
                    
                    if (!$videoId) {
                        $uploadWarning = "Video upload failed. Check logs for details (likely OAuth or SSL issue).";
                        \Log::warning('YouTube upload skipped - Video ID null returned');
                    }
                } catch (\Exception $uploadError) {
                    // Log but don't fail - allow module creation without video
                    $uploadWarning = "Video upload failed: " . $uploadError->getMessage();
                    \Log::error('YouTube upload error: ' . $uploadError->getMessage());
                }
            }
            
            // Handle Document
            $docUrl = $request->doc_url; // Default to provided URL (e.g. GDrive)
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
