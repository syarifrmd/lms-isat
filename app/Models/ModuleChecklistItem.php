<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ModuleChecklistItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_id',
        'title',
        'type',
        'description',
        'order_sequence',
        'xp_reward',
    ];

    protected $casts = [
        'xp_reward' => 'integer',
        'order_sequence' => 'integer',
    ];

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function progress()
    {
        return $this->hasMany(ModuleProgress::class, 'checklist_item_id');
    }
}
