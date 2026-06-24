import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown } from "lucide-react"
import { type SortEntry } from "@/hooks/use-crud"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

type BivariantRender<T> = {
    bivarianceHack: (value: unknown, item: T, onRefresh?: () => void) => React.ReactNode
}["bivarianceHack"]

export type Column<T> = {
    key: string
    title: React.ReactNode
    width?: string | number
    fixed?: 'left' | 'right'
    align?: 'left' | 'right' | 'center'
    className?: string
    truncate?: boolean
    sortable?: boolean
    render?: BivariantRender<T>
}

function renderTableValue(value: unknown): React.ReactNode {
    if (React.isValidElement(value)) return value
    if (value === null || value === undefined) return null
    if (typeof value === "string" || typeof value === "number") return value
    if (typeof value === "boolean") return value ? "true" : "false"
    return JSON.stringify(value)
}

function toCssLength(width: string | number | undefined): string | null {
    if (typeof width === "number") return `${width}px`
    if (typeof width === "string" && width.length > 0) return width
    return null
}

function sumCssLengths(widths: string[]): string {
    if (widths.length === 0) return "0px"
    if (widths.length === 1) return widths[0]
    return `calc(${widths.join(" + ")})`
}

export type DataTableProps<T> = {
    items: T[]
    columns: Column<T>[]
    // Sticky header is a display capability, not a page-layout concern.
    // It assumes the host area has a single primary vertical scroll container.
    stickyTop?: number
    sorts?: SortEntry[]
    onSort?: (key: string) => void
    onRefresh?: () => void
}

export function DataTable<T extends { id: string | number }>({
    items,
    columns,
    stickyTop = 0,
    sorts = [],
    onSort,
    onRefresh
}: DataTableProps<T>) {
    const hasExplicitWidths = columns.some((col) => col.width != null)
    const hasFixedColumns = columns.some(
        (col) => col.fixed === "left" || col.fixed === "right"
    )
    const useSplitStickyHeader = hasExplicitWidths || hasFixedColumns
    const bodyScrollRef = React.useRef<HTMLDivElement | null>(null)
    const headerScrollRef = React.useRef<HTMLDivElement | null>(null)

    const fixedOffsets = React.useMemo(() => {
        const left: Array<string | undefined> = []
        const right: Array<string | undefined> = []
        const leftWidths: string[] = []
        const rightWidths: string[] = []

        columns.forEach((col, idx) => {
            if (col.fixed !== "left") return

            left[idx] = sumCssLengths(leftWidths)
            const width = toCssLength(col.width)
            if (width) leftWidths.push(width)
        })

        for (let idx = columns.length - 1; idx >= 0; idx -= 1) {
            const col = columns[idx]
            if (col.fixed !== "right") continue

            right[idx] = sumCssLengths(rightWidths)
            const width = toCssLength(col.width)
            if (width) rightWidths.push(width)
        }

        return { left, right }
    }, [columns])

    const tableClassName = cn(
        "w-full caption-bottom text-sm border-separate border-spacing-0",
        hasExplicitWidths && "table-fixed",
    )

    const renderColGroup = () =>
        hasExplicitWidths ? (
            <colgroup>
                {columns.map((col, idx) => (
                    <col
                        key={col.key || idx}
                        style={
                            col.width != null
                                ? {
                                      width: col.width,
                                      minWidth: col.width,
                                      maxWidth: col.width,
                                  }
                                : undefined
                        }
                    />
                ))}
            </colgroup>
        ) : null

    const renderHeaderCells = () =>
        columns.map((col, idx) => (
            <TableHead
                key={col.key || idx}
                className={cn(
                    "z-30 bg-muted/50 py-3 font-semibold text-foreground border-b",
                    !useSplitStickyHeader &&
                        "sticky top-[var(--table-sticky-top)]",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.fixed === "left" && "z-40 border-r bg-card shadow-[4px_0_10px_-8px_rgba(0,0,0,0.35)]",
                    col.fixed === "right" && "z-40 border-l bg-card shadow-[-4px_0_10px_-8px_rgba(0,0,0,0.35)]",
                    col.sortable && "cursor-pointer hover:bg-muted/70 select-none",
                    col.className
                )}
                style={{
                    backgroundColor: "var(--card)",
                    left: col.fixed === "left" ? fixedOffsets.left[idx] : undefined,
                    right: col.fixed === "right" ? fixedOffsets.right[idx] : undefined,
                    overflow: col.truncate ? "hidden" : undefined,
                    position: useSplitStickyHeader
                        ? col.fixed
                            ? "sticky"
                            : undefined
                        : undefined,
                }}
                onClick={() => col.sortable && onSort && onSort(col.key)}
            >
                <div
                    className={cn(
                        "flex items-center gap-1",
                        col.align === "right" && "justify-end",
                        col.align === "center" && "justify-center"
                    )}
                >
                    {col.title}
                    {col.sortable &&
                        (() => {
                            const sortIdx = sorts.findIndex((s) => s.key === col.key)
                            const sortEntry = sortIdx !== -1 ? sorts[sortIdx] : null
                            return (
                                <div className="ml-1 flex items-center">
                                    <div className="flex flex-col">
                                        <ChevronUp
                                            className={cn(
                                                "h-3 w-3 -mb-1",
                                                sortEntry?.dir === "asc"
                                                    ? "opacity-100 text-indigo-600 dark:text-indigo-400"
                                                    : "opacity-30"
                                            )}
                                        />
                                        <ChevronDown
                                            className={cn(
                                                "h-3 w-3",
                                                sortEntry?.dir === "desc"
                                                    ? "opacity-100 text-indigo-600 dark:text-indigo-400"
                                                    : "opacity-30"
                                            )}
                                        />
                                    </div>
                                    {sortEntry && sorts.length > 1 && (
                                        <span className="ml-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                            {sortIdx + 1}
                                        </span>
                                    )}
                                </div>
                            )
                        })()}
                </div>
            </TableHead>
        ))

    const renderBody = () => (
        <TableBody>
            {items.length > 0 ? (
                items.map((item) => (
                    <TableRow key={item.id} className="group border-b last:border-0 hover:bg-muted/30">
                        {columns.map((col, colIdx) => {
                            const row = item as Record<string, unknown>
                            const value = col.render
                                ? col.render(row[col.key], item, onRefresh)
                                : row[col.key]

                            const cellContent = col.truncate ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="truncate max-w-full cursor-help text-foreground">
                                            {renderTableValue(value)}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[400px] break-all">
                                        {renderTableValue(value)}
                                    </TooltipContent>
                                </Tooltip>
                            ) : renderTableValue(value)

                            return (
                                <TableCell
                                    key={col.key || colIdx}
                                    className={cn(
                                        col.fixed ? "bg-card transition-colors group-hover:bg-muted" : "bg-card transition-colors group-hover:bg-muted/30",
                                        col.align === 'right' && "text-right",
                                        col.align === 'center' && "text-center",
                                        col.fixed === 'left' && "sticky z-20 border-r shadow-[4px_0_10px_-8px_rgba(0,0,0,0.35)]",
                                        col.fixed === 'right' && "sticky z-20 border-l shadow-[-4px_0_10px_-8px_rgba(0,0,0,0.35)]",
                                        col.truncate && "overflow-hidden",
                                        col.className
                                    )}
                                    style={{
                                        left: col.fixed === "left" ? fixedOffsets.left[colIdx] : undefined,
                                        right: col.fixed === "right" ? fixedOffsets.right[colIdx] : undefined,
                                        overflow: col.truncate ? 'hidden' : undefined,
                                    }}
                                >
                                    {cellContent}
                                </TableCell>
                            )
                        })}
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={columns.length} className="h-40 text-center text-muted-foreground">
                        No records found.
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
    )

    React.useEffect(() => {
        if (!useSplitStickyHeader) return

        const bodyElement = bodyScrollRef.current
        const headerElement = headerScrollRef.current

        if (!bodyElement || !headerElement) return

        const syncHeaderScroll = () => {
            headerElement.scrollLeft = bodyElement.scrollLeft
        }

        syncHeaderScroll()
        bodyElement.addEventListener("scroll", syncHeaderScroll, { passive: true })

        return () => {
            bodyElement.removeEventListener("scroll", syncHeaderScroll)
        }
    }, [useSplitStickyHeader])

    return (
        <TooltipProvider>
            <div
                className="relative min-w-0 w-full max-w-full rounded-md border shadow-sm"
                style={{ '--table-sticky-top': `${stickyTop}px` } as React.CSSProperties}
            >
                {useSplitStickyHeader ? (
                    <>
                        <div className="sticky top-[var(--table-sticky-top)] z-30 min-w-0 max-w-full border-b bg-card">
                            <div
                                ref={headerScrollRef}
                                className="min-w-0 max-w-full overflow-hidden"
                            >
                                <table data-slot="table" className={tableClassName}>
                                    {renderColGroup()}
                                    <TableHeader className="z-30">
                                        <TableRow className="bg-muted/50 hover:bg-muted/50 border-b">
                                            {renderHeaderCells()}
                                        </TableRow>
                                    </TableHeader>
                                </table>
                            </div>
                        </div>
                        <div ref={bodyScrollRef} className="min-w-0 max-w-full overflow-x-auto overflow-y-visible">
                            <table data-slot="table" className={tableClassName}>
                                {renderColGroup()}
                                {renderBody()}
                            </table>
                        </div>
                    </>
                ) : (
                    <Table className={tableClassName}>
                        {renderColGroup()}
                        <TableHeader className="z-30">
                            <TableRow className="bg-muted/50 hover:bg-muted/50 border-b">
                                {renderHeaderCells()}
                            </TableRow>
                        </TableHeader>
                        {renderBody()}
                    </Table>
                )}
            </div>
        </TooltipProvider>
    )
}
