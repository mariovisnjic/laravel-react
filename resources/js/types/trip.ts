export type TripConfig = {
    id: number;
    duration: number;
    period: string | null;
    arrival_by_car: boolean;
    arrival_by_plane: boolean;
    adults: number;
    kids: number;
    budget: string | null;
    interests: string[] | null;
    max_stops: number;
    created_at: string;
};
