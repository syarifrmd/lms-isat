<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Course;
use App\Models\Module;
use App\Models\ModuleChecklistItem;
use App\Models\ModuleProgress;

$courseId = 15;
$course = Course::find($courseId);
if (!$course) {
    echo "Course 15 not found.\n";
    exit;
}

echo "Course: {$course->title} (ID: {$course->id})\n";
foreach ($course->modules as $m) {
    echo "  Module ID: {$m->id}, Title: {$m->title}, Doc URL: {$m->doc_url}, Video URL: {$m->video_url}, Text Content length: " . strlen($m->content_text) . "\n";
    foreach ($m->checklistItems as $item) {
        echo "    Checklist Item ID: {$item->id}, Title: {$item->title}, Type: {$item->type}\n";
    }
    
    // Progress for enrollment 10
    $progresses = ModuleProgress::where('enrollment_id', 10)->where('module_id', $m->id)->get();
    foreach ($progresses as $p) {
        echo "    Progress ID: {$p->id}, Checklist ID: " . ($p->checklist_item_id ?? 'NULL') . 
             ", completed: " . ($p->is_completed ? 'Y' : 'N') . 
             ", doc_read: " . ($p->is_document_read ? 'Y' : 'N') . 
             ", doc_pages: {$p->doc_current_page} / {$p->doc_total_pages}\n";
    }
}
