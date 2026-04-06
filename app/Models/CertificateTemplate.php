<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CertificateTemplate extends Model
{
    protected $fillable = [
        'name',
        'background_image_path',
        'layout_data',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'layout_data' => 'array',
    ];
}
