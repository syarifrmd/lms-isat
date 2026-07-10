<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Journey extends Model
{
    protected $fillable = [
        'title',
        'description',
        'cover_url',
        'status',
        'created_by',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    public function courses()
    {
        return $this->hasMany(Course::class);
    }

    public function divisions()
    {
        return $this->hasMany(JourneyDivision::class);
    }
}
