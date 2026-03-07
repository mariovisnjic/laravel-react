<?php

namespace App\Http\Controllers;

use App\Models\TripConfiguration;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TripConfigurationController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'duration'        => ['required', 'integer', 'min:1', 'max:7'],
            'period'          => ['nullable', 'string'],
            'arrival_by_car'  => ['boolean'],
            'arrival_by_plane'=> ['boolean'],
            'adults'          => ['required', 'integer', 'min:1', 'max:10'],
            'kids'            => ['required', 'integer', 'min:0', 'max:10'],
            'budget'          => ['nullable', 'string', 'in:low,medium,high,large'],
            'interests'       => ['nullable', 'array'],
            'interests.*'     => ['string', 'in:beach,active,culture,gastronomy'],
            'max_stops'       => ['required', 'integer', 'min:0'],
        ]);

        $latest = TripConfiguration::where('user_id', $request->user()->id)
            ->latest()
            ->first();

        $isDuplicate = $latest && $latest->duration == $validated['duration']
            && $latest->period == ($validated['period'] ?? null)
            && $latest->arrival_by_car == ($validated['arrival_by_car'] ?? false)
            && $latest->arrival_by_plane == ($validated['arrival_by_plane'] ?? false)
            && $latest->adults == $validated['adults']
            && $latest->kids == $validated['kids']
            && $latest->budget == ($validated['budget'] ?? null)
            && $latest->max_stops == $validated['max_stops']
            && collect($latest->interests ?? [])->sort()->values()->toArray() === collect($validated['interests'] ?? [])->sort()->values()->toArray();

        if (! $isDuplicate) {
            TripConfiguration::create($validated + ['user_id' => $request->user()->id]);
        }

        return to_route('dashboard');
    }
}
