import * as React from "react"
import { Plus, ChevronLeft, ChevronRight, Loader2, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SearchFilterGroup, resolveInitialFilterState, type FilterClause, type SearchFilterItem } from "@/components/common/query-filters"
import { DataTable, type Column } from "@/components/common/data-table"
import { useCrud, type SortEntry } from "@/hooks/use-crud"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ListPageActions, ListPageShell } from "@/components/common/list-page-shell"

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
    icon?: LucideIcon
    description?: string
    addButtonLabel?: string
    searchPlaceholder?: string
    onAdd?: () => void
    headerActions?: React.ReactNode
    embedded?: boolean

    // Internal Fetching Props
    endpoint?: string
    idKey?: string
    filterItems?: SearchFilterItem[]
    storageKey?: string
    defaultFilters?: Record<string, FilterClause>

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
    footer?: React.ReactNode

    // Legacy escape hatch during migration to dedicated detail routes.
    children?: React.ReactNode
}

// CrudLayout is a list-oriented composition component.
// It may orchestrate filters, pagination, and rendering, but it should not encode
// resource-specific page structure beyond generic list semantics.
export function CrudLayout<T extends { id: string | number }>({
    title,
    icon,
    description,
    addButtonLabel,
    onAdd,
    headerActions,
    embedded = false,
    isLoading: manualIsLoading,
    items: manualItems,
    columns = [],
    itemsRender,
    children,
    endpoint,
    filterItems,
    storageKey,
    defaultFilters,
    stickyTop = 0,
    onFilterChange,
    pageSizeOptions = [10, 20, 30, 40, 50],
    defaultPageSize = 20,
    footer,
}: CrudLayoutProps<T>) {
    const [filters, setFilters] = React.useState<Record<string, unknown>>(() =>
        resolveInitialFilterState(storageKey, defaultFilters)
    )
    const ResolvedItemsRender = itemsRender ?? DataTable<T>
    const pageActions = React.useMemo(() => {
        const nodes = React.Children.toArray(headerActions)
        if (addButtonLabel && onAdd) {
            nodes.push(
                <Button key="crud-add" onClick={onAdd}>
                    <Plus className="mr-2 h-4 w-4" /> {addButtonLabel}
                </Button>
            )
        }
        return nodes
    }, [addButtonLabel, headerActions, onAdd])

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
        isValidating,
        mutate,
    } = internalCrud

    const currentFilterSignature = React.useMemo(
        () => JSON.stringify(filters),
        [filters]
    )

    const handleFilterChange = React.useCallback((newFilters: Record<string, unknown>) => {
        const nextFilterSignature = JSON.stringify(newFilters)
        const shouldForceRefresh = Boolean(endpoint) && nextFilterSignature === currentFilterSignature

        setFilters(newFilters)
        setPage(1) // Explicitly reset page on filter change
        onFilterChange?.(newFilters)

        if (shouldForceRefresh) {
            void mutate()
        }
    }, [currentFilterSignature, endpoint, mutate, onFilterChange, setPage])

    /**
     * Multi-column sort handler:
     *  - Click new column → append as desc
     *  - Click existing desc → toggle to asc
     *  - Click existing asc → remove from sorts
     */
    const handleSort = React.useCallback((key: string) => {
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
    }, [updateSorts])

    const totalPages = Math.ceil(total / pageSize)

    const showSectionHeader = embedded || !icon

    const content = (
        <div className="min-w-0 space-y-2">
            {showSectionHeader ? (
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
                    </div>
                    <div className="shrink-0">
                        <ListPageActions actions={pageActions} />
                    </div>
                </div>
            ) : null}

            {filterItems && endpoint && (
                <SearchFilterGroup
                    title="Filter"
                    items={filterItems}
                    onSearch={handleFilterChange}
                    storageKey={storageKey}
                    initialFilters={defaultFilters}
                />
            )}


            {/* Content Section */}
            <div className="relative min-h-[200px] min-w-0">
                {isValidating && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className="bg-white/80 backdrop-blur-sm border shadow-sm rounded-full px-3 py-1 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-300">
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                            <span className="text-xs font-medium text-slate-600">Syncing data...</span>
                        </div>
                    </div>
                )}

                <div className={isLoading ? "min-w-0 opacity-50 transition-opacity duration-300 pointer-events-none" : "min-w-0 transition-opacity duration-300"}>
                    <ResolvedItemsRender 
                        items={items} 
                        columns={columns} 
                        stickyTop={stickyTop} 
                        sorts={sorts}
                        onSort={handleSort}
                        onRefresh={mutate}
                    />
                </div>

                {/* Internal Pagination - Only if using internal Fetching */}
                {endpoint && total > 0 && (
                    <div className="mt-3 flex items-center justify-between border-t px-2 py-3">
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

            {footer ?? children}
        </div>
    )

    if (showSectionHeader) {
        return content
    }

    return (
        <ListPageShell title={title} icon={icon} actions={pageActions}>
            {content}
        </ListPageShell>
    )
}
