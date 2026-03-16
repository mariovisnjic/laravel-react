import type { RiskInsights } from '@/types';

type Props = {
    insights: RiskInsights | null;
};

function TempoBar({ score }: { score: number }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">{score}</span>
                <span className="text-sm text-muted-foreground">/ 10</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{ width: `${score * 10}%` }}
                />
            </div>
            <span className="text-xs text-muted-foreground">
                {score >= 8 ? 'Relaxed Pace' : score >= 5 ? 'Moderate Pace' : 'Fast Pace'}
            </span>
        </div>
    );
}

const LOAD_COLORS = {
    LOW:    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    HIGH:   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const LOAD_LABELS = {
    LOW:    'Single Base',
    MEDIUM: 'Multiple Transfers',
    HIGH:   'Frequent Moves',
};

function EnergyCurveChart({ curve }: { curve: number[] }) {
    if (curve.length === 0) return null;

    const height = 60;
    const width = 200;
    const maxVal = 10;
    const points = curve.map((v, i) => {
        const x = (i / Math.max(curve.length - 1, 1)) * width;
        const y = height - (v / maxVal) * height;
        return `${x},${y}`;
    });
    const polyline = points.join(' ');

    return (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>High</span>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
                <defs>
                    <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Fill area */}
                <polygon
                    points={`0,${height} ${polyline} ${width},${height}`}
                    fill="url(#energyGrad)"
                />
                {/* Line */}
                <polyline
                    points={polyline}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>Days</span>
            </div>
        </div>
    );
}

export function RiskInsightsPanel({ insights }: Props) {
    if (!insights) {
        return (
            <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
                Risk &amp; insights will appear here after analysis.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 p-4">
            <h2 className="text-base font-semibold">Risk &amp; Insights</h2>

            {/* Tempo Score */}
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Tempo Score</span>
                <TempoBar score={insights.tempo_score} />
            </div>

            <hr className="border-border" />

            {/* Logistic Load */}
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Logistic Load</span>
                <div className="flex items-center gap-2">
                    <span className={`rounded-md px-3 py-1 text-sm font-semibold ${LOAD_COLORS[insights.logistic_load]}`}>
                        {insights.logistic_load}
                    </span>
                    <span className="text-xs text-muted-foreground">{LOAD_LABELS[insights.logistic_load]}</span>
                </div>
            </div>

            <hr className="border-border" />

            {/* Energy Curve */}
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Energy Curve</span>
                <EnergyCurveChart curve={insights.energy_curve} />
            </div>

            {/* Warnings */}
            {insights.warnings.length > 0 && (
                <>
                    <hr className="border-border" />
                    <div className="flex flex-col gap-2">
                        {insights.warnings.map((warning, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                                <span className="mt-0.5 shrink-0 text-yellow-500">⚠</span>
                                <span className="text-muted-foreground">{warning}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
