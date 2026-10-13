export const WQB_REGION_OPTIONS = [
    "USA",
    "GLB",
    "EUR",
    "ASI",
    "CHN",
    "JPN",
    "IND",
    "MEA",
    "DEU",
    "GBR",
].map((region) => ({ label: region, value: region }))

const NEUTRALIZATION_LABELS = new Map([
    ["REVERSION_AND_MOMENTUM", "Rev+Mom"],
    ["SLOW_AND_FAST", "Slow+Fast"],
    ["STATISTICAL", "Stat"],
    ["SUBINDUSTRY", "Subind"],
    ["CROWDING", "Crowd"],
])

export function formatNeutralization(value: string) {
    return NEUTRALIZATION_LABELS.get(value) ?? (value || "—")
}
