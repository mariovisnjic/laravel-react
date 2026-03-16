<?php

namespace App\Http\Controllers;

use App\Models\TripConfiguration;
use App\Services\TripDecisionEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    public function __construct(private TripDecisionEngine $engine) {}

    /**
     * Generate trip recommendations from the user's latest (or posted) config.
     */
    public function generate(Request $request): JsonResponse
    {
        $user = $request->user();

        // Use posted config ID or fall back to user's latest
        if ($request->filled('trip_configuration_id')) {
            $config = TripConfiguration::where('user_id', $user->id)
                ->findOrFail($request->integer('trip_configuration_id'));
        } else {
            $config = TripConfiguration::where('user_id', $user->id)
                ->latest()
                ->firstOrFail();
        }

        $result = $this->engine->generate($config);

        return response()->json($result);
    }
}
