<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TripConfiguration extends Model
{
    protected $fillable = [
        'user_id',
        'duration',
        'period',
        'arrival_by_car',
        'arrival_by_plane',
        'adults',
        'kids',
        'budget',
        'interests',
        'max_stops',
    ];

    protected $casts = [
        'arrival_by_car' => 'boolean',
        'arrival_by_plane' => 'boolean',
        'interests' => 'array',
    ];
}
