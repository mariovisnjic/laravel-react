<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\TripConfigurationController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('trip-configuration', [TripConfigurationController::class, 'store'])->name('trip-configuration.store');
    Route::post('recommendations', [RecommendationController::class, 'generate'])->name('recommendations.generate');
});

require __DIR__.'/settings.php';
