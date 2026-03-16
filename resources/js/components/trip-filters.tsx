import { useForm } from '@inertiajs/react';
import TripConfigurationController from '@/actions/App/Http/Controllers/TripConfigurationController';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TripConfig } from '@/types';

type Interest = 'beach' | 'active' | 'culture' | 'gastronomy';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const AMOUNTS = Array.from({ length: 10 }, (_, i) => i + 1);
const KIDS_AMOUNTS = Array.from({ length: 11 }, (_, i) => i);
const INTERESTS = ['Beach', 'Active', 'Culture', 'Gastronomy'] as const;

export function TripFilters({ configs = [], onAnalyse }: { configs?: TripConfig[]; onAnalyse?: (configId?: number) => void }) {
    const { data, setData, post, processing } = useForm({
        duration: 1,
        period: '',
        arrival_by_car: false,
        arrival_by_plane: false,
        adults: 1,
        kids: 0,
        budget: '',
        interests: [] as Interest[],
        max_stops: 1,
    });

    function toggleInterest(interest: Interest) {
        setData(
            'interests',
            data.interests.includes(interest)
                ? data.interests.filter((i) => i !== interest)
                : [...data.interests, interest],
        );
    }

    function loadConfig(config: TripConfig) {
        setData({
            duration: config.duration,
            period: config.period ?? '',
            arrival_by_car: config.arrival_by_car,
            arrival_by_plane: config.arrival_by_plane,
            adults: config.adults,
            kids: config.kids,
            budget: config.budget ?? '',
            interests: (config.interests ?? []) as Interest[],
            max_stops: config.max_stops,
        });
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(TripConfigurationController.store().url, {
            onSuccess: () => onAnalyse?.(),
        });
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-5 p-4 text-sm">
            {/* Duration */}
            <div className="flex flex-col gap-2">
                <Label className="font-semibold">Duration</Label>
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min={1}
                        max={7}
                        value={data.duration}
                        onChange={(e) => setData('duration', Number(e.target.value))}
                        className="h-1.5 w-full cursor-pointer accent-primary"
                    />
                    <span className="w-16 shrink-0 text-right text-muted-foreground">
                        {data.duration === 1 ? '1 day' : `${data.duration} days`}
                    </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                    {Array.from({ length: 7 }, (_, i) => (
                        <span key={i + 1}>{i + 1}</span>
                    ))}
                </div>
            </div>

            {/* Period */}
            <div className="flex flex-col gap-2">
                <Label className="font-semibold">Period</Label>
                <Select value={data.period} onValueChange={(v) => setData('period', v)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                        {MONTHS.map((month) => (
                            <SelectItem key={month} value={month.toLowerCase()}>{month}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Arrival */}
            <div className="flex flex-col gap-2">
                <Label className="font-semibold">Arrival</Label>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="by-car"
                            checked={data.arrival_by_car}
                            onCheckedChange={(checked) => setData('arrival_by_car', !!checked)}
                        />
                        <Label htmlFor="by-car">By car</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="by-plane"
                            checked={data.arrival_by_plane}
                            onCheckedChange={(checked) => setData('arrival_by_plane', !!checked)}
                        />
                        <Label htmlFor="by-plane">By plane</Label>
                    </div>
                </div>
            </div>

            {/* Travelers */}
            <div className="flex flex-col gap-2">
                <Label className="font-semibold">Travelers</Label>
                <div className="flex gap-2">
                    <Select value={String(data.adults)} onValueChange={(v) => setData('adults', Number(v))}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Adults" />
                        </SelectTrigger>
                        <SelectContent>
                            {AMOUNTS.map((n) => (
                                <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'adult' : 'adults'}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={String(data.kids)} onValueChange={(v) => setData('kids', Number(v))}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Kids" />
                        </SelectTrigger>
                        <SelectContent>
                            {KIDS_AMOUNTS.map((n) => (
                                <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'kid' : 'kids'}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Budget */}
            <div className="flex flex-col gap-2">
                <Label className="font-semibold">Budget</Label>
                <Select value={data.budget} onValueChange={(v) => setData('budget', v)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select budget" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Interest */}
            <div className="flex flex-col gap-2">
                <Label className="font-semibold">Interest</Label>
                <div className="grid grid-cols-2 gap-2">
                    {INTERESTS.map((interest) => {
                        const value = interest.toLowerCase() as Interest;
                        return (
                            <div key={interest} className="flex items-center gap-2">
                                <Checkbox
                                    id={`interest-${value}`}
                                    checked={data.interests.includes(value)}
                                    onCheckedChange={() => toggleInterest(value)}
                                />
                                <Label htmlFor={`interest-${value}`}>{interest}</Label>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Max Stops */}
            <div className="flex flex-col gap-2">
                <Label className="font-semibold">Max Stops</Label>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setData('max_stops', Math.max(0, data.max_stops - 1))}
                        className="flex size-8 shrink-0 items-center justify-center rounded-md border border-input bg-transparent text-lg hover:bg-accent"
                    >
                        −
                    </button>
                    <span className="flex-1 text-center">{data.max_stops} {data.max_stops === 1 ? 'stop' : 'stops'}</span>
                    <button
                        type="button"
                        onClick={() => setData('max_stops', data.max_stops + 1)}
                        className="flex size-8 shrink-0 items-center justify-center rounded-md border border-input bg-transparent text-lg hover:bg-accent"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Submit */}
            <Button type="submit" disabled={processing} className="w-full cursor-pointer">
                Analyse Structure
            </Button>

            {configs.length > 0 && (
                <>
                    <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs text-muted-foreground">History</span>
                        <div className="h-px flex-1 bg-border" />
                    </div>

                    <div className="flex flex-col gap-1">
                        {configs.map((config) => (
                            <button
                                key={config.id}
                                type="button"
                                onClick={() => loadConfig(config)}
                                className="flex w-full cursor-pointer flex-col gap-0.5 rounded-lg border border-input px-3 py-2 text-left hover:bg-accent"
                            >
                                <span className="font-medium">
                                    {config.duration === 1 ? '1 day' : `${config.duration} days`}
                                    {config.period ? ` · ${config.period.charAt(0).toUpperCase() + config.period.slice(1)}` : ''}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {config.adults} {config.adults === 1 ? 'adult' : 'adults'}
                                    {config.kids > 0 ? `, ${config.kids} ${config.kids === 1 ? 'kid' : 'kids'}` : ''}
                                    {config.budget ? ` · ${config.budget.charAt(0).toUpperCase() + config.budget.slice(1)} budget` : ''}
                                    {config.max_stops > 0 ? ` · ${config.max_stops} ${config.max_stops === 1 ? 'stop' : 'stops'}` : ''}
                                </span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </form>
    );
}
