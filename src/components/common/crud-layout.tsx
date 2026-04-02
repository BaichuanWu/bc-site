import * as React from "react"
import { Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SearchFilterGroup, type SearchFilterItem } from "@/components/common/query-filters"
import { DataTable, type Column } from "@/components/common/data-table"
import { useCrud, type SortEntry } from "@/hooks/use-crud"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export type ItemsRenderProps<T> = {
    items: T[]
    columns: Column<T>[]
    stickyTop?: number
    sorts?: SortEntry[]
    onSort?: (key: string) => void
    onRefresh?: () => void
}

export type CrudLayoutProps<T extends { id: string | number }> = {
    title: string
    description: string
    addButtonLabel?: string
    searchPlaceholder?: string
    onAdd?: () => void

    // Internal Fetching Props
    endpoint?: string
    idKey?: string
    filterItems?: SearchFilterItem[]
    storageKey?: string

    // Manual Override Props (Optional)
    items?: T[]
    isLoading?: boolean

    // Rendering Props
    columns?: Column<T>[]
    itemsRender?: React.ComponentType<ItemsRenderProps<T>>
    stickyTop?: number
    onFilterChange?: (filters: Record<string, unknown>) => void
    pageSizeOptions?: number[]
    defaultPageSize?: number

    children?: React.ReactNode
}

export function CrudLayout<T extends { id: string | number }>({
    title,
    description,
    addButtonLabel,
    onAdd,
    isLoading: manualIsLoading,
    items: manualItems,
    columns = [],
    itemsRender,
    children,
    endpoint,
    filterItems,
    storageKey,
    stickyTop = 56, // Default to dashboard header height (h-14)
    onFilterChange,
    pageSizeOptions = [10, 20, 30, 40, 50],
    defaultPageSize = 20
}: CrudLayoutProps<T>) {
    const [filters, setFilters] = React.useState<Record<string, unknown>>({})
    const ResolvedItemsRender = itemsRender ?? DataTable<T>

    const handleFilterChange = (newFilters: Record<string, unknown>) => {
        setFilters(newFilters)
        internalCrud.setPage(1) // Explicitly reset page on filter change
        onFilterChange?.(newFilters)
    }

    // If endpoint is provided, use internal useCrud
    const internalCrud = useCrud<T>(
        endpoint || "",
        "", // searchParamName is removed from props, so we pass empty for now
        filters,
        defaultPageSize
    )

    // Merge manual and internal states
    const items = endpoint ? internalCrud.data : (manualItems || [])
    const isLoading = endpoint ? internalCrud.isLoading : (manualIsLoading || false)

    const {
        page,
        setPage,
        pageSize,
        setPageSize,
        total,
        sorts,
        updateSorts,
        isValidating
    } = internalCrud

    /**
     * Multi-column sort handler:
     *  - Click new column → append as desc
     *  - Click existing desc → toggle to asc
     *  - Click existing asc → remove from sorts
     */
    const handleSort = (key: string) => {
        updateSorts((prev: SortEntry[]) => {
            const idx = prev.findIndex((s: SortEntry) => s.key === key)
            if (idx === -1) {
                // New column, add as desc
                return [...prev, { key, dir: 'desc' as const }]
            }
            const existing = prev[idx]
            if (existing.dir === 'desc') {
                // Toggle to asc
                return prev.map((s: SortEntry, i: number) => i === idx ? { ...s, dir: 'asc' as const } : s)
            }
            // Already asc, remove
            return prev.filter((_: SortEntry, i: number) => i !== idx)
        })
    }

    const totalPages = Math.ceil(total / pageSize)

    return (
        <div className="space-y-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                    <p className="text-muted-foreground">{description}</p>
                </div>
                {addButtonLabel && onAdd && (
                    <Button onClick={onAdd}>
                        <Plus className="mr-2 h-4 w-4" /> {addButtonLabel}
                    </Button>
                )}
            </div>

            {filterItems && endpoint && (
                <SearchFilterGroup
                    title="Filters"
                    items={filterItems}
                    onSearch={handleFilterChange}
                    storageKey={storageKey}
                />
            )}


            {/* Content Section */}
            <div className="relative min-h-[200px]">
                {isValidating && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className="bg-white/80 backdrop-blur-sm border shadow-sm rounded-full px-3 py-1 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-300">
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                            <span className="text-xs font-medium text-slate-600">Syncing data...</span>
                        </div>
                    </div>
                )}

                <div className={isLoading ? "opacity-50 transition-opacity duration-300 pointer-events-none" : "transition-opacity duration-300"}>
                    <ResolvedItemsRender 
                        items={items} 
                        columns={columns} 
                        stickyTop={stickyTop} 
                        sorts={sorts}
                        onSort={handleSort}
                        onRefresh={internalCrud.mutate}
                    />
                </div>

                {/* Internal Pagination - Only if using internal Fetching */}
                {endpoint && total > 0 && (
                    <div className="flex items-center justify-between px-2 py-4 border-t mt-4">
                        <div className="text-sm text-muted-foreground">
                            Total <span className="font-medium">{total}</span> items
                        </div>
                        <div className="flex items-center gap-6 lg:gap-8">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">Rows per page</p>
                                <Select
                                    value={String(pageSize)}
                                    onValueChange={(value) => {
                                        setPageSize(Number(value))
                                        setPage(1)
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[70px]">
                                        <SelectValue placeholder={pageSize} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {pageSizeOptions.map((size) => (
                                            <SelectItem key={size} value={String(size)}>
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                                Page {page} of {totalPages || 1}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <span className="sr-only">Go to previous page</span>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || totalPages === 0}
                                >
                                    <span className="sr-only">Go to next page</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {children}
        </div>
    )
}
