<?php

namespace App\Http\Controllers;

use App\Models\TripConfiguration;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $configs = TripConfiguration::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return Inertia::render('dashboard', [
            'tripConfigs' => $configs,
        ]);
    }
}
