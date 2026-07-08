<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JourneyDivision extends Model
{
    protected $fillable = [
        'journey_id',
        'target_division',
        'is_mandatory',
        'position',
    ];

    protected $casts = [
        'is_mandatory' => 'boolean',
    ];

    public function journey()
    {
        return $this->belongsTo(Journey::class);
    }
}
