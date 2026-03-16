export type Location = {
    id: number;
    name: string;
    slug: string;
    region: string;
    latitude: number;
    longitude: number;
    beach_score: number;
    culture_score: number;
    active_score: number;
    gastronomy_score: number;
    family_score: number;
    budget_tier: number;
    min_stay_days: number;
    max_stay_days: number;
    car_accessible: boolean;
    plane_accessible: boolean;
    peak_months: string[];
    shoulder_months: string[];
    description: string | null;
};

export type TripSegment = {
    location: Location;
    days: number;
    segment_type: string;
    activities: string[];
};

export type TripScenario = {
    label: 'A' | 'B' | 'C';
    segments: TripSegment[];
    total_score: number;
};

export type RiskInsights = {
    tempo_score: number;       // 1–10
    logistic_load: 'LOW' | 'MEDIUM' | 'HIGH';
    location_changes: number;
    energy_curve: number[];    // per-day energy level
    warnings: string[];
};

export type Recommendation = {
    scenarios: TripScenario[];
    insights: RiskInsights;
};
