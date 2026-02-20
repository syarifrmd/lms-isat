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
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
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
}
