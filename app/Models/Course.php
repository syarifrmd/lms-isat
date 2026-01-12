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
        'duration',
        'created_by',
        'status',
        'cover_url',
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
}
