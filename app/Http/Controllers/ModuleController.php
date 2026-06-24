<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\Course;
use App\Services\YouTubeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use CloudConvert\Laravel\Facades\CloudConvert;
use CloudConvert\Models\Job;
use CloudConvert\Models\Task;

class ModuleController extends Controller
{
    protected $youtube;

    public function __construct(YouTubeService $youtube)
    {
        $this->youtube = $youtube;
    }

    public function uploadDocument(Request $request)
    {
        $request->validate([
            'doc_file' => [
                'required',
                'file',
                'max:51200',
                function ($attribute, $value, $fail) {
                    $ext = strtolower($value->getClientOriginalExtension());
                    if (!in_array($ext, ['pdf', 'ppt', 'pptx', 'doc', 'docx'])) {
                        $fail('The document must be a PDF, PPT, PPTX, DOC, or DOCX file.');
                    }
                },
            ],
        ]);

        if ($request->hasFile('doc_file')) {
            $url = $this->handleDocumentUpload($request->file('doc_file'));
            
            return response()->json([
                'url' => $url,
                'message' => 'File uploaded successfully'
            ]);
        }

        return response()->json(['error' => 'No file uploaded'], 400);
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
            'video' => 'nullable|file|mimetypes:video/mp4,video/quicktime,video/x-matroska,video/avi,video/mpeg,video/webm|max:5242880', // 5GB limit
            'video_link' => 'nullable|string|max:500',
            'youtube_video_id' => 'nullable|string|max:20',
            'doc_file' => [
                'nullable',
                'file',
                'max:51200',
                function ($attribute, $value, $fail) {
                    if ($value) {
                        $ext = strtolower($value->getClientOriginalExtension());
                        if (!in_array($ext, ['pdf', 'ppt', 'pptx', 'doc', 'docx'])) {
                            $fail('The document must be a PDF, PPT, PPTX, DOC, or DOCX file.');
                        }
                    }
                },
            ],
            'doc_url' => 'nullable|string',
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
                $updateData['doc_url'] = $this->handleDocumentUpload($request->file('doc_file'));
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
            'video' => 'nullable|file|mimetypes:video/mp4,video/quicktime,video/x-matroska,video/avi,video/mpeg,video/webm|max:5242880', // 5GB limit
            'video_link' => 'nullable|string|max:500',
            'youtube_video_id' => 'nullable|string|max:20',
            'doc_file' => [
                'nullable',
                'file',
                'max:51200',
                function ($attribute, $value, $fail) {
                    if ($value) {
                        $ext = strtolower($value->getClientOriginalExtension());
                        if (!in_array($ext, ['pdf', 'ppt', 'pptx', 'doc', 'docx'])) {
                            $fail('The document must be a PDF, PPT, PPTX, DOC, or DOCX file.');
                        }
                    }
                },
            ], // 50MB
            'doc_url' => 'nullable|string',
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
                $docUrl = $this->handleDocumentUpload($request->file('doc_file'));
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
    private function handleDocumentUpload($file): string
    {
        $ext = strtolower($file->getClientOriginalExtension());
        $filename = \Illuminate\Support\Str::random(40) . '.' . $ext;
        
        // Simpan file asli (termasuk .pptx)
        $path = $file->storeAs('module_docs', $filename, 'public');
        $finalUrl = Storage::url($path);

        // Jika tipe PPT/PPTX, coba konversi ke PDF menggunakan CloudConvert
        if (in_array($ext, ['ppt', 'pptx'])) {
            try {
                $absolutePath = storage_path('app/public/' . $path);
                
                $job = CloudConvert::jobs()->create(
                    (new Job())
                    ->addTask(new Task('import/upload', 'import-ppt'))
                    ->addTask(
                        (new Task('convert', 'convert-to-pdf'))
                        ->set('input', 'import-ppt')
                        ->set('input_format', $ext)
                        ->set('output_format', 'pdf')
                        ->set('engine', 'office')
                    )
                    ->addTask(
                        (new Task('export/url', 'export-pdf'))
                        ->set('input', 'convert-to-pdf')
                    )
                );

                $uploadTask = $job->getTasks()->whereName('import-ppt')[0];
                CloudConvert::tasks()->upload($uploadTask, fopen($absolutePath, 'r'), $filename);

                CloudConvert::jobs()->wait($job);
                $job = CloudConvert::jobs()->get($job->getId()); 
                
                if ($job->getStatus() === 'error') {
                    $errorMsgs = [];
                    foreach ($job->getTasks() as $task) {
                        if ($task->getStatus() === 'error') {
                            $errorMsgs[] = $task->getName() . ': ' . $task->getMessage();
                        }
                    }
                    throw new \Exception(implode(', ', $errorMsgs));
                }
                
                $exportTask = $job->getTasks()->whereName('export-pdf')[0];
                $fileUrl = $exportTask->getResult()->files[0]->url;

                $pdfContent = file_get_contents($fileUrl);
                $pdfFilename = \Illuminate\Support\Str::random(40) . '.pdf';
                $pdfPath = 'module_docs/' . $pdfFilename;
                
                Storage::disk('public')->put($pdfPath, $pdfContent);
                
                // Hapus PPTX asli agar tidak menuh-menuhin storage
                Storage::disk('public')->delete($path);

                $finalUrl = Storage::url($pdfPath);
            } catch (\Exception $e) {
                // FALLBACK: CloudConvert gagal (kredit habis / api error)
                // Tangkap error, abaikan, dan file PPTX akan dipertahankan
                \Log::warning('CloudConvert fallback to original PPTX: ' . $e->getMessage());
            }
        }

        return $finalUrl;
    }

    public function destroy(Course $course, Module $module)
    {
        $user = Auth::user();

        if ($user->role !== 'admin' && $course->created_by !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        // Delete stored document file if any
        if ($module->doc_url && str_starts_with($module->doc_url, '/storage/')) {
            $path = str_replace('/storage/', '', $module->doc_url);
            Storage::disk('public')->delete($path);
        }

        $module->delete();

        return back()->with('success', 'Module deleted successfully.');
    }
}