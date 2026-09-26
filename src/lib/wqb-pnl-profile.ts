export type WqbPnlProfile = {
    status?: string
    profileVersion?: number
    observationCount?: number
    longestFlatRun?: number
    recentLongestFlatRun?: number
    recentLongestFlatRunStart?: string | null
    recentLongestFlatRunEnd?: string | null
    warmupObservationCount?: number
    recentTwoYearChange?: number | null
    recentAnnualChanges?: Record<string, number>
    recentAnnualSharpes?: Record<string, number>
    recentMinimumAnnualSharpe?: number | null
    currentYear?: number | null
    currentYearSharpe?: number | null
}

export function formatPnlValue(value: unknown, digits = 2): string {
    const number = Number(value)
    return Number.isFinite(number) ? number.toFixed(digits) : "-"
}

export function formatRecentAnnualChanges(profile?: WqbPnlProfile): string {
    const entries = recentAnnualChangeEntries(profile)
    if (entries.length === 0) return "-"
    return entries
        .map(([year, change]) => `${year}: ${formatPnlValue(change)}`)
        .join(" · ")
}

export function recentAnnualChangeEntries(
    profile?: WqbPnlProfile,
): Array<[string, number]> {
    const changes = profile?.recentAnnualChanges
    if (!changes) return []
    return Object.entries(changes).sort(
        ([left], [right]) => Number(left) - Number(right),
    )
}

export function recentAnnualSharpeEntries(
    profile?: WqbPnlProfile,
): Array<[string, number, boolean]> {
    const entries = Object.entries(profile?.recentAnnualSharpes ?? {})
        .sort(([left], [right]) => Number(left) - Number(right))
        .map(([year, sharpe]) => [year, sharpe, false] as [string, number, boolean])
    const currentYear = profile?.currentYear
    const currentSharpe = Number(profile?.currentYearSharpe)
    if (currentYear != null && Number.isFinite(currentSharpe)) {
        entries.push([String(currentYear), currentSharpe, true])
    }
    return entries
}
