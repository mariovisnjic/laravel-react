import { Head } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import { RiskInsightsPanel } from '@/components/risk-insights';
import { TripFilters } from '@/components/trip-filters';
import { TripRecommendation } from '@/components/trip-recommendation';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, Recommendation, TripConfig } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

export default function Dashboard({ tripConfigs }: { tripConfigs: TripConfig[] }) {
    const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
    const [loading, setLoading] = useState(false);

    async function fetchRecommendation() {
        setLoading(true);
        try {
            const response = await axios.post<Recommendation>('/recommendations');
            setRecommendation(response.data);
        } catch {
            // If no config saved yet, silently ignore
        } finally {
            setLoading(false);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid flex-1 gap-4 md:grid-cols-3">
                    <div className="overflow-y-auto rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <TripFilters configs={tripConfigs} onAnalyse={fetchRecommendation} />
                    </div>
                    <div className="overflow-y-auto rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <TripRecommendation recommendation={recommendation} loading={loading} />
                    </div>
                    <div className="overflow-y-auto rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <RiskInsightsPanel insights={recommendation?.insights ?? null} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
