<?php

namespace App\Services;

use App\Models\Location;
use App\Models\TripConfiguration;

class TripDecisionEngine
{
    // Budget string to tier mapping
    private const BUDGET_TIERS = [
        'low'       => 1,
        'medium'    => 2,
        'upper_mid' => 3,
        'large'     => 4,
    ];

    // Interest name → location column
    private const INTEREST_COLUMNS = [
        'beach'       => 'beach_score',
        'active'      => 'active_score',
        'culture'     => 'culture_score',
        'gastronomy'  => 'gastronomy_score',
    ];

    /**
     * Generate 3 trip scenarios from a TripConfiguration.
     *
     * @return array{scenarios: array, insights: array}
     */
    public function generate(TripConfiguration $config): array
    {
        $locations = Location::all();

        $scored = $this->scoreAll($locations, $config);

        // Sort by score descending
        $sorted = $scored->sortByDesc('score')->values();

        $scenarioA = $this->buildScenario($sorted, $config, 'A', 'best_match');
        $scenarioB = $this->buildScenario($sorted, $config, 'B', 'balanced');
        $scenarioC = $this->buildScenario($sorted, $config, 'C', 'compact');

        $insights = $this->buildInsights([$scenarioA, $scenarioB, $scenarioC], $config);

        return [
            'scenarios' => [$scenarioA, $scenarioB, $scenarioC],
            'insights'  => $insights,
        ];
    }

    /**
     * Score every location against the trip configuration.
     */
    private function scoreAll($locations, TripConfiguration $config): \Illuminate\Support\Collection
    {
        $interests   = $config->interests ?? [];
        $budgetTier  = self::BUDGET_TIERS[$config->budget] ?? 2;
        $period      = $config->period;
        $hasCar      = $config->arrival_by_car;
        $hasPlane    = $config->arrival_by_plane;
        $kids        = $config->kids;
        $duration    = $config->duration;

        return $locations->map(function (Location $location) use (
            $interests, $budgetTier, $period, $hasCar, $hasPlane, $kids, $duration
        ) {
            $score = 0;

            // --- Interest matching (max ~40 pts per interest) ---
            foreach ($interests as $interest) {
                $column = self::INTEREST_COLUMNS[$interest] ?? null;
                if ($column) {
                    $score += $location->$column * 4;
                }
            }

            // If no interests selected, use average as baseline
            if (empty($interests)) {
                $score += ($location->beach_score + $location->active_score
                    + $location->culture_score + $location->gastronomy_score) / 4 * 4;
            }

            // --- Family / kids factor ---
            if ($kids > 0) {
                $kidMultiplier = min(1 + $kids * 0.15, 2.0);
                $score += $location->family_score * $kidMultiplier * 2;
            }

            // --- Budget compatibility ---
            $budgetDiff = $location->budget_tier - $budgetTier;
            if ($budgetDiff > 0) {
                $score -= $budgetDiff * 15; // too expensive
            } elseif ($budgetDiff < 0) {
                $score += 5; // cheaper than expected = mild bonus
            }

            // --- Arrival method ---
            if ($hasCar && ! $location->car_accessible) {
                $score -= 20;
            }
            if ($hasPlane && ! $location->plane_accessible) {
                $score -= 10;
            }

            // --- Season match ---
            if ($period) {
                if (in_array($period, $location->peak_months, true)) {
                    $score += 10;
                } elseif (in_array($period, $location->shoulder_months, true)) {
                    $score += 5;
                } else {
                    $score -= 5; // off-season
                }
            }

            // --- Duration feasibility ---
            if ($duration < $location->min_stay_days) {
                $score -= 15;
            }

            return [
                'location' => $location,
                'score'    => max(0, round($score, 1)),
            ];
        });
    }

    /**
     * Build a trip scenario from ranked locations.
     *
     * Strategy:
     *   A = pure top-ranked picks
     *   B = top pick + one diverse wildcard from different region
     *   C = single-region compact trip (fewest moves)
     */
    private function buildScenario(
        \Illuminate\Support\Collection $sorted,
        TripConfiguration $config,
        string $label,
        string $strategy
    ): array {
        $maxStops  = $config->max_stops + 1; // stops = segments
        $duration  = $config->duration;

        $picked = match ($strategy) {
            'balanced' => $this->pickBalanced($sorted, $maxStops),
            'compact'  => $this->pickCompact($sorted, $maxStops),
            default    => $sorted->take($maxStops)->pluck('location'),
        };

        $segments = $this->assignDays($picked, $duration);

        return [
            'label'       => $label,
            'segments'    => $segments,
            'total_score' => $sorted->take(count($segments))->sum('score'),
        ];
    }

    /**
     * Pick top location + wildcard from a different region / secondary interest.
     */
    private function pickBalanced(\Illuminate\Support\Collection $sorted, int $maxStops): \Illuminate\Support\Collection
    {
        $top = $sorted->first();
        $picks = collect([$top['location']]);

        $topRegion = $top['location']->region;

        // Fill remaining slots: alternate region for variety
        $sorted->skip(1)->each(function ($entry) use (&$picks, $topRegion, $maxStops) {
            if ($picks->count() >= $maxStops) {
                return false;
            }
            if ($entry['location']->region !== $topRegion || $picks->count() < $maxStops - 1) {
                $picks->push($entry['location']);
            }
        });

        // Pad with next best if needed
        if ($picks->count() < $maxStops) {
            $sorted->each(function ($entry) use (&$picks, $maxStops) {
                if ($picks->count() >= $maxStops) {
                    return false;
                }
                if (! $picks->contains('id', $entry['location']->id)) {
                    $picks->push($entry['location']);
                }
            });
        }

        return $picks;
    }

    /**
     * Pick locations within the same or adjacent region (fewer logistics).
     */
    private function pickCompact(\Illuminate\Support\Collection $sorted, int $maxStops): \Illuminate\Support\Collection
    {
        // Find the region with the most high-scoring locations
        $regionCounts = $sorted->take(10)->groupBy(fn ($e) => $e['location']->region);
        $dominantRegion = $regionCounts->map->count()->sortDesc()->keys()->first();

        $regionPicks = $sorted->filter(fn ($e) => $e['location']->region === $dominantRegion)
            ->take($maxStops)
            ->pluck('location');

        // Pad if region doesn't have enough
        if ($regionPicks->count() < $maxStops) {
            $sorted->each(function ($entry) use (&$regionPicks, $maxStops) {
                if ($regionPicks->count() >= $maxStops) {
                    return false;
                }
                if (! $regionPicks->contains('id', $entry['location']->id)) {
                    $regionPicks->push($entry['location']);
                }
            });
        }

        return $regionPicks;
    }

    /**
     * Distribute available days across segments, weighted by max_stay_days.
     */
    private function assignDays(\Illuminate\Support\Collection $locations, int $totalDays): array
    {
        $totalWeight = $locations->sum('max_stay_days') ?: 1;
        $remaining   = $totalDays;
        $count       = $locations->count();
        $segments    = [];

        foreach ($locations as $i => $location) {
            $isLast = ($i === $count - 1);

            if ($isLast) {
                $days = max(1, $remaining);
            } else {
                $days = max(1, (int) round($totalDays * ($location->max_stay_days / $totalWeight)));
                $days = min($days, $remaining - ($count - $i - 1));
            }

            $remaining -= $days;

            $segments[] = [
                'location'     => $location,
                'days'         => $days,
                'segment_type' => $this->resolveSegmentType($location, $i),
                'activities'   => $this->resolveActivities($location),
            ];
        }

        return $segments;
    }

    /**
     * Assign a human-readable segment type label.
     */
    private function resolveSegmentType(Location $location, int $index): string
    {
        $scores = [
            'beach_score'      => $location->beach_score,
            'culture_score'    => $location->culture_score,
            'active_score'     => $location->active_score,
            'gastronomy_score' => $location->gastronomy_score,
        ];

        arsort($scores);
        $topKey = array_key_first($scores);

        $typeMap = [
            'beach_score'      => $index === 0 ? 'BASE' : 'BEACH STAY',
            'culture_score'    => 'CULTURE DAY',
            'active_score'     => 'ACTIVE DAY',
            'gastronomy_score' => 'SLOW RELAX',
        ];

        return $typeMap[$topKey] ?? 'STAY';
    }

    /**
     * Suggest activity labels for a location based on top scores.
     */
    private function resolveActivities(Location $location): array
    {
        $activities = [];

        if ($location->active_score >= 8) {
            $activities[] = 'Hiking / Nature';
        }
        if ($location->beach_score >= 8) {
            $activities[] = 'Beach & Swimming';
        }
        if ($location->culture_score >= 8) {
            $activities[] = 'Old Town / Museums';
        }
        if ($location->gastronomy_score >= 8) {
            $activities[] = 'Local Cuisine';
        }
        if ($location->family_score >= 8) {
            $activities[] = 'Family Activities';
        }

        return array_slice($activities, 0, 2);
    }

    /**
     * Calculate risk and insight metrics across all scenarios.
     */
    private function buildInsights(array $scenarios, TripConfiguration $config): array
    {
        $scenarioA  = $scenarios[0];
        $segmentCount = count($scenarioA['segments']);
        $duration   = $config->duration;
        $kids       = $config->kids;

        // Tempo Score: how rushed is the trip (1 = very rushed, 10 = very relaxed)
        $avgDaysPerStop = $segmentCount > 0 ? $duration / $segmentCount : $duration;
        $tempoScore = min(10, max(1, round($avgDaysPerStop * 2)));

        // Logistic Load
        $locationChanges = $segmentCount - 1;
        $logisticLoad = match (true) {
            $locationChanges <= 1 => 'LOW',
            $locationChanges <= 3 => 'MEDIUM',
            default               => 'HIGH',
        };

        // Energy Curve: array of energy level per day
        $energyCurve = $this->buildEnergyCurve($scenarioA['segments'], $duration);

        // Warnings
        $warnings = [];

        if ($locationChanges > $config->max_stops) {
            $warnings[] = "{$locationChanges} location changes exceed your max stops preference.";
        }

        if ($kids > 0) {
            foreach ($scenarioA['segments'] as $segment) {
                if ($segment['location']->culture_score >= 9 && $segment['days'] >= 2) {
                    $warnings[] = "Culture-heavy stop at {$segment['location']->name} may be tiring for kids.";
                    break;
                }
            }
        }

        foreach ($scenarioA['segments'] as $i => $segment) {
            $day = array_sum(array_column(array_slice($scenarioA['segments'], 0, $i + 1), 'days'));
            if ($segment['location']->active_score >= 8 && $i > 0 && $segment['days'] >= 2) {
                $warnings[] = "Watch for energy dip after active days at {$segment['location']->name}.";
                break;
            }
        }

        if ($config->period) {
            $firstLocation = $scenarioA['segments'][0]['location'];
            if (
                ! in_array($config->period, $firstLocation->peak_months)
                && ! in_array($config->period, $firstLocation->shoulder_months)
            ) {
                $warnings[] = "{$firstLocation->name} is off-season in {$config->period}.";
            }
        }

        return [
            'tempo_score'      => $tempoScore,
            'logistic_load'    => $logisticLoad,
            'location_changes' => $locationChanges,
            'energy_curve'     => $energyCurve,
            'warnings'         => $warnings,
        ];
    }

    /**
     * Build a per-day energy level array from segments.
     * Energy starts high, dips mid-trip, recovers toward slow/beach days.
     */
    private function buildEnergyCurve(array $segments, int $duration): array
    {
        $curve = [];
        $day   = 0;

        foreach ($segments as $segment) {
            $base = ($segment['location']->active_score + $segment['location']->beach_score) / 2;

            for ($d = 0; $d < $segment['days']; $d++) {
                $fatigueDrop = $day * 0.3;
                $energy = max(1, round($base - $fatigueDrop + ($d === 0 ? 2 : 0), 1));
                $curve[] = min(10, $energy);
                $day++;
            }
        }

        return array_slice($curve, 0, $duration);
    }
}
