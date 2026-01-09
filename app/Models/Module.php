<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'title',
        'video_url',
        'doc_url',
        'content_text',
        'order_sequence',
        'duration_minutes',
        'xp_amounts',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
