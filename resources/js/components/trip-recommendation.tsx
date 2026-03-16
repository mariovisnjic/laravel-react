import type { Recommendation, TripScenario } from '@/types';
import { useState } from 'react';

type Props = {
    recommendation: Recommendation | null;
    loading: boolean;
};

const SEGMENT_COLORS: Record<string, string> = {
    BASE:         'bg-blue-700 text-white',
    'ACTIVE DAY': 'bg-green-700 text-white',
    'BEACH STAY': 'bg-teal-600 text-white',
    'ISLAND STAY':'bg-teal-600 text-white',
    'CULTURE DAY':'bg-orange-600 text-white',
    'SLOW RELAX': 'bg-yellow-700 text-white',
    STAY:         'bg-slate-600 text-white',
};

function segmentColor(type: string): string {
    return SEGMENT_COLORS[type] ?? 'bg-slate-500 text-white';
}

function ScenarioView({ scenario }: { scenario: TripScenario }) {
    return (
        <div className="mt-4 flex flex-wrap gap-3">
            {scenario.segments.map((seg, i) => {
                const dayLabel =
                    seg.days === 1
                        ? `Day ${i === 0 ? 1 : scenario.segments.slice(0, i).reduce((a, s) => a + s.days, 1) + 1}`
                        : (() => {
                              const start = scenario.segments.slice(0, i).reduce((a, s) => a + s.days, 1) + 1;
                              return `Days ${start}~${start + seg.days - 1}`;
                          })();

                return (
                    <div key={i} className="flex min-w-[120px] flex-1 flex-col gap-1">
                        <div className={`flex flex-col items-center rounded-lg px-3 py-3 ${segmentColor(seg.segment_type)}`}>
                            <span className="text-xs font-medium opacity-90">{dayLabel}</span>
                            <span className="mt-0.5 text-center text-sm font-bold leading-tight">{seg.location.name.toUpperCase()}</span>
                            <span className="mt-1 rounded bg-white/20 px-2 py-0.5 text-xs font-semibold">{seg.segment_type}</span>
                        </div>
                        {seg.activities.length > 0 && (
                            <div className="rounded border border-border bg-muted/50 px-2 py-1.5 text-center text-xs text-muted-foreground">
                                {seg.activities.join(' / ')}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function TripRecommendation({ recommendation, loading }: Props) {
    const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C'>('A');

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <span className="text-sm">Analysing trip options…</span>
                </div>
            </div>
        );
    }

    if (!recommendation) {
        return (
            <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
                Fill in your profile and click <strong className="mx-1">Analyse Structure</strong> to see recommended trips.
            </div>
        );
    }

    const activeScenario = recommendation.scenarios.find((s) => s.label === activeTab)!;

    return (
        <div className="flex flex-col gap-4 p-4">
            <h2 className="text-base font-semibold">Recommended Trip Structure</h2>

            {/* Tabs */}
            <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
                {(['A', 'B', 'C'] as const).map((label) => (
                    <button
                        key={label}
                        type="button"
                        onClick={() => setActiveTab(label)}
                        className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                            activeTab === label
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Scenario {label}
                    </button>
                ))}
            </div>

            <ScenarioView scenario={activeScenario} />

            {/* Segment legend */}
            <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(SEGMENT_COLORS).slice(0, 5).map(([type, cls]) => (
                    <span key={type} className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
                        {type}
                    </span>
                ))}
            </div>
        </div>
    );
}
