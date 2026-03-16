<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'region',
        'latitude',
        'longitude',
        'beach_score',
        'culture_score',
        'active_score',
        'gastronomy_score',
        'family_score',
        'budget_tier',
        'min_stay_days',
        'max_stay_days',
        'car_accessible',
        'plane_accessible',
        'peak_months',
        'shoulder_months',
        'description',
    ];

    protected $casts = [
        'car_accessible'   => 'boolean',
        'plane_accessible' => 'boolean',
        'peak_months'      => 'array',
        'shoulder_months'  => 'array',
    ];
}
