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
        'is_quiz_passed',
        'highest_quiz_score',
        'is_completed',
        'completed_at',
    ];

    protected $casts = [
        'is_video_watched' => 'boolean',
        'is_text_read' => 'boolean',
        'is_quiz_passed' => 'boolean',
        'is_completed' => 'boolean',
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
