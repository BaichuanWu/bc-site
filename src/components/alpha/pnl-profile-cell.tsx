import { cn } from "@/lib/utils"
import {
    formatPnlValue,
    recentAnnualSharpeEntries,
    type WqbPnlProfile,
} from "@/lib/wqb-pnl-profile"

function tone(value: number): string {
    if (value > 0) return "text-emerald-600 dark:text-emerald-400"
    if (value < 0) return "text-rose-600 dark:text-rose-400"
    return "text-muted-foreground"
}

export function SharpeValue({ value }: { value: unknown }) {
    const number = Number(value)
    if (!Number.isFinite(number)) return <span className="text-muted-foreground">-</span>

    return (
        <span className={cn("whitespace-nowrap font-mono text-xs tabular-nums", tone(number))}>
            {number > 0 ? "+" : ""}{formatPnlValue(number)}
        </span>
    )
}

export function FlatObservationCount({ value }: { value: unknown }) {
    const number = Number(value)
    if (!Number.isFinite(number)) return <span className="text-muted-foreground">-</span>

    return (
        <span
            className="whitespace-nowrap font-mono text-xs tabular-nums"
            title={`${number.toLocaleString()} consecutive unchanged PnL observations`}
        >
            {number.toLocaleString()} <span className="text-[10px] text-muted-foreground">obs</span>
        </span>
    )
}

export function RecentFlatPeriod({ profile }: { profile?: WqbPnlProfile }) {
    const value = profile?.recentLongestFlatRun
    const start = profile?.recentLongestFlatRunStart
    const end = profile?.recentLongestFlatRunEnd
    return (
        <div className="max-w-full text-right leading-4">
            <FlatObservationCount value={value} />
            {start && end && Number(value) > 0 ? (
                <div className="whitespace-nowrap text-[10px] text-muted-foreground" title={`${start} to ${end}`}>
                    {start.slice(0, 7)} → {end.slice(0, 7)}
                </div>
            ) : null}
        </div>
    )
}

export function AnnualSharpes({ profile }: { profile?: WqbPnlProfile }) {
    const entries = recentAnnualSharpeEntries(profile)
    if (entries.length === 0) return <span className="text-muted-foreground">-</span>

    return (
        <div className="grid max-w-full grid-cols-1 gap-0.5 py-0.5 text-[11px] leading-4">
            {entries.map(([year, value, isYtd]) => (
                <div key={year} className="flex min-w-0 items-center justify-between gap-2 whitespace-nowrap">
                    <span className="text-muted-foreground">
                        {year}{isYtd ? " YTD" : ""}
                    </span>
                    <SharpeValue value={value} />
                </div>
            ))}
        </div>
    )
}
