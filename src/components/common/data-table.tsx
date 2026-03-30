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

export type Column<T> = {
    key: string
    title: React.ReactNode
    width?: string | number
    fixed?: 'left' | 'right'
    align?: 'left' | 'right' | 'center'
    className?: string
    truncate?: boolean
    sortable?: boolean
    render?: (value: any, item: T, onRefresh?: () => void) => React.ReactNode
}

export type DataTableProps<T> = {
    items: T[]
    columns: Column<T>[]
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
    const containerRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        let frameId: number

        const updatePosition = () => {
            const container = containerRef.current
            if (!container) return

            const rect = container.getBoundingClientRect()
            let newOffset = 0

            if (rect.top < stickyTop) {
                const offset = stickyTop - rect.top
                const maxOffset = Math.max(0, rect.height - 48)
                newOffset = Math.min(offset, maxOffset)
            }

            // Directly update CSS variable on the DOM element to bypass React reconciliation
            container.style.setProperty('--header-offset', `${newOffset}px`)
        }

        const handleScroll = () => {
            cancelAnimationFrame(frameId)
            frameId = requestAnimationFrame(updatePosition)
        }

        const scrollParent = containerRef.current?.closest('main') || window
        scrollParent.addEventListener('scroll', handleScroll, { passive: true })
        window.addEventListener('scroll', handleScroll, { passive: true })

        updatePosition()

        return () => {
            cancelAnimationFrame(frameId)
            scrollParent.removeEventListener('scroll', handleScroll)
            window.removeEventListener('scroll', handleScroll)
        }
    }, [stickyTop])

    return (
        <TooltipProvider>
            <div
                ref={containerRef}
                className="rounded-md border relative shadow-sm"
                style={{ '--header-offset': '0px' } as React.CSSProperties}
            >
                <Table className="border-separate border-spacing-0">
                    <TableHeader
                        className="relative z-30 transition-none will-change-transform"
                        style={{
                            transform: 'translate3d(0, var(--header-offset, 0px), 0)',
                            backgroundColor: 'var(--card)'
                        }}
                    >
                        <TableRow className="bg-muted/50 hover:bg-muted/50 border-b">
                            {columns.map((col, idx) => (
                                <TableHead
                                    key={col.key || idx}
                                    className={cn(
                                        "bg-muted/50 py-3 font-semibold text-foreground border-b",
                                        col.align === 'right' && "text-right",
                                        col.align === 'center' && "text-center",
                                        col.fixed === 'left' && "sticky left-0 z-40 border-r",
                                        col.fixed === 'right' && "sticky right-0 z-40 border-l",
                                        col.sortable && "cursor-pointer hover:bg-muted/70 select-none",
                                        col.className
                                    )}
                                    style={{
                                        width: col.width,
                                        minWidth: col.width,
                                        maxWidth: col.width,
                                        overflow: col.truncate ? 'hidden' : undefined
                                    }}
                                    onClick={() => col.sortable && onSort && onSort(col.key)}
                                >
                                    <div className={cn("flex items-center gap-1", 
                                        col.align === 'right' && "justify-end",
                                        col.align === 'center' && "justify-center"
                                    )}>
                                        {col.title}
                                        {col.sortable && (() => {
                                            const sortIdx = sorts.findIndex(s => s.key === col.key)
                                            const sortEntry = sortIdx !== -1 ? sorts[sortIdx] : null
                                            return (
                                                <div className="flex items-center ml-1">
                                                    <div className="flex flex-col">
                                                        <ChevronUp className={cn("h-3 w-3 -mb-1", sortEntry?.dir === 'asc' ? "opacity-100 text-indigo-600 dark:text-indigo-400" : "opacity-30")} />
                                                        <ChevronDown className={cn("h-3 w-3", sortEntry?.dir === 'desc' ? "opacity-100 text-indigo-600 dark:text-indigo-400" : "opacity-30")} />
                                                    </div>
                                                    {sortEntry && sorts.length > 1 && (
                                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 ml-0.5">{sortIdx + 1}</span>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length > 0 ? (
                            items.map((item) => (
                                <TableRow key={item.id} className="group border-b last:border-0 hover:bg-muted/30">
                                    {columns.map((col, colIdx) => {
                                        const value = col.render
                                            ? col.render((item as any)[col.key], item, onRefresh)
                                            : (item as any)[col.key];

                                        const cellContent = col.truncate ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="truncate max-w-full cursor-help text-foreground">
                                                        {value}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-[400px] break-all">
                                                    {value}
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : value;

                                        return (
                                            <TableCell
                                                key={col.key || colIdx}
                                                className={cn(
                                                    "bg-card transition-colors group-hover:bg-muted/30",
                                                    col.align === 'right' && "text-right",
                                                    col.align === 'center' && "text-center",
                                                    col.fixed === 'left' && "sticky left-0 z-20 border-r",
                                                    col.fixed === 'right' && "sticky right-0 z-20 border-l shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none",
                                                    col.truncate && "overflow-hidden",
                                                    col.className
                                                )}
                                                style={{
                                                    width: col.width,
                                                    minWidth: col.width,
                                                    maxWidth: col.width
                                                }}
                                            >
                                                {cellContent}
                                            </TableCell>
                                        );
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
                </Table>
            </div>
        </TooltipProvider>
    )
}
