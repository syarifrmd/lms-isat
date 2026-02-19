<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'course_id',
        'module_id',
        'title',
        'min_score',
        'passing_score',
        'is_timed',
        'time_limit_second',
        'xp_bonus',
        'status',
    ];

    protected $casts = [
        'is_timed' => 'boolean',
        'xp_bonus' => 'decimal:2',
    ];

    /**
     * Get the course that owns the quiz.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the module that owns the quiz (optional).
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    /**
     * Get the questions for the quiz.
     */
    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    /**
     * Get the user attempts for the quiz.
     */
    public function attempts(): HasMany
    {
        return $this->hasMany(UserQuizAttempt::class);
    }
}
