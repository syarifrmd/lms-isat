<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'category',
        'start_date',
        'end_date',
        'created_by',
        'status',
        'cover_url',
        'is_mandatory',     
        'target_division',
        'is_timer_active',
        'duration_minutes',
        'position',
        'prerequisite_course_id',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_mandatory' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }
    
    public function modules()
    {
        return $this->hasMany(Module::class)->orderBy('order_sequence');
    }

    public function quizzes()
    {
        return $this->hasMany(Quiz::class);
    }

    public function ratings()
    {
        return $this->hasMany(CourseRating::class);
    }

    /**
     * Average rating as a float, or null if no ratings yet.
     */
    public function getAverageRatingAttribute(): ?float
    {
        $avg = $this->ratings()->avg('rating');
        return $avg ? round((float) $avg, 1) : null;
    }

    public function prerequisite()
{
    return $this->belongsTo(Course::class, 'prerequisite_course_id');
}
}
