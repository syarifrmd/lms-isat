<?php
/**
 * Reset document progress records that are stuck for testing.
 * This deletes progress records with checklist_item_id = null (document tracking)
 * so users can re-track them with the fixed code.
 */
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\ModuleProgress;
use App\Models\Enrollment;

// Show what will be deleted
$stuck = ModuleProgress::whereNull('checklist_item_id')->get();
echo "Document progress records (checklist_item_id = null):\n";
foreach ($stuck as $p) {
    echo "  ID: {$p->id}, Enrollment: {$p->enrollment_id}, Module: {$p->module_id}, doc_read: " . ($p->is_document_read ? 'Y' : 'N') . ", completed: " . ($p->is_completed ? 'Y' : 'N') . "\n";
}

// Delete all document progress records (checklist_item_id = null) that are not yet completed
$deleted = ModuleProgress::whereNull('checklist_item_id')
    ->where(function($q) {
        $q->where('is_completed', false)->orWhereNull('is_completed');
    })
    ->delete();

echo "\nDeleted {$deleted} stuck document progress record(s).\n";

// Also reset enrollment progress_percentage to 0 for affected enrollments
// (Enrollment 10 specifically for user 88888 on course 15)
$enrollments = Enrollment::where('progress_percentage', 0)->get();
echo "\nEnrollments with 0% progress:\n";
foreach ($enrollments as $e) {
    echo "  ID: {$e->id}, User: {$e->user_id}, Course: {$e->course_id}, Status: {$e->status}\n";
}
