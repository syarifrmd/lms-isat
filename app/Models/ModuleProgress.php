<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ModuleProgress extends Model
{
    use HasFactory;

    protected $table = 'module_progress';

    protected $fillable = [
        'enrollment_id',
        'module_id',
        'checklist_item_id',
        'is_video_watched',
        'is_text_read',
        'is_document_read',
        'is_quiz_passed',
        'highest_quiz_score',
        'video_last_position_seconds',
        'video_max_position_seconds',
        'video_duration_seconds',
        'text_elapsed_seconds',
        'text_scroll_percentage',
        'doc_current_page',
        'doc_total_pages',
        'is_completed',
        'completed_at',
    ];

    protected $casts = [
        'is_video_watched' => 'boolean',
        'is_text_read' => 'boolean',
        'is_document_read' => 'boolean',
        'is_quiz_passed' => 'boolean',
        'is_completed' => 'boolean',
        'video_last_position_seconds' => 'decimal:2',
        'video_max_position_seconds' => 'decimal:2',
        'video_duration_seconds' => 'decimal:2',
        'text_elapsed_seconds' => 'integer',
        'text_scroll_percentage' => 'decimal:2',
        'doc_current_page' => 'integer',
        'doc_total_pages' => 'integer',
        'completed_at' => 'datetime',
    ];

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function checklistItem()
    {
        return $this->belongsTo(ModuleChecklistItem::class, 'checklist_item_id');
    }
}
