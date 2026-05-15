import * as React from "react"
import useSWR, { useSWRConfig } from "swr"
import { apiClient, fetcher } from "@/lib/api"
import { toast } from "sonner"

export type SortEntry = { key: string; dir: 'asc' | 'desc' }
type CrudListResponse<T> = {
    dataSource?: T[]
    total?: number
}

export function useCrudListRefresh(endpoint: string) {
    const { mutate } = useSWRConfig()

    return React.useCallback(
        () =>
            mutate(
                (key: unknown) =>
                    typeof key === "string" && key.startsWith(`${endpoint}?`),
                undefined,
                { revalidate: true }
            ),
        [endpoint, mutate]
    )
}

export function useCrud<T extends { id: string | number }>(
    endpoint: string,
    searchParamName?: string,
    additionalQueries: Record<string, unknown> = {},
    defaultPageSize: number = 20
) {
    const [search, setSearch] = React.useState("")
    const [debouncedSearch, setDebouncedSearch] = React.useState("")
    const [page, setPage] = React.useState(1)
    const [pageSize, setPageSize] = React.useState(defaultPageSize)
    const [sorts, setSorts] = React.useState<SortEntry[]>([])

    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(timer)
    }, [search])

    // Reset pagination on search change (primitive string is stable)
    React.useEffect(() => {
        setPage(1)
    }, [debouncedSearch])

    const queryParamsString = React.useMemo(() => {
        const params = new URLSearchParams()
        const qPayload: Record<string, unknown> = {}

        // Attach all hard filters preserving objects like { ge: 10 }
        Object.entries(additionalQueries).forEach(([key, val]) => {
            if (val !== "" && val !== "all" && val != null) {
                // Remove empty sub-objects if present like {}
                if (typeof val === 'object' && Object.keys(val).length === 0) return;
                qPayload[key] = val
            }
        })

        // Attach the text search mapping it natively to { "like": "%...%" }
        if (debouncedSearch && searchParamName) {
            const cleanKey = searchParamName.replace(/Regexp|Like|_regexp|_like/g, '')
            qPayload[cleanKey] = { like: `%${debouncedSearch}%` }
        }

        if (Object.keys(qPayload).length > 0) {
            params.set("q", JSON.stringify(qPayload))
        }

        // Pagination params (skip and limit)
        const skip = (page - 1) * pageSize
        params.set("skip", String(skip))
        params.set("limit", String(pageSize))

        // Sorting params (comma-separated string for backend)
        if (sorts.length > 0) {
            const orderByStr = sorts.map(s => s.dir === 'desc' ? `-${s.key}` : s.key).join(',')
            params.set("orderBy", orderByStr)
        }

        return params.toString()
    }, [page, pageSize, debouncedSearch, sorts, additionalQueries, searchParamName])

    const swrKey = endpoint ? `${endpoint}?${queryParamsString}` : null


    const { data: resultData, mutate, isLoading, isValidating } = useSWR<CrudListResponse<T>>(
        swrKey,
        fetcher,
        {
            keepPreviousData: true,
            dedupingInterval: 200,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            revalidateIfStale: false
        }
    )

    const { data, total } = React.useMemo(() => {
        const listResult = resultData ?? null
        const resolvedData: T[] = Array.isArray(listResult?.dataSource)
            ? listResult.dataSource
            : []
        const resolvedTotal = listResult?.total || 0
        return { data: resolvedData, total: resolvedTotal }
    }, [resultData])

    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<T | null>(null)
    const [isSaving, setIsSaving] = React.useState(false)

    const handleOpenDialog = React.useCallback((item?: T) => {
        setEditingItem(item || null)
        setIsDialogOpen(true)
    }, [])

    const handleCloseDialog = React.useCallback(() => {
        setIsDialogOpen(false)
        setEditingItem(null)
    }, [])

    const handleSave = React.useCallback(async (payload: Partial<T>) => {
        try {
            setIsSaving(true)
            if (!endpoint) throw new Error("Cannot save without a CRUD endpoint")
            if (editingItem) {
                await apiClient.put(endpoint, { ...payload, id: editingItem.id })
            } else {
                await apiClient.post(endpoint, payload)
            }
            handleCloseDialog()
            mutate()
        } catch {
            toast.error("Failed to save data")
        } finally {
            setIsSaving(false)
        }
    }, [editingItem, endpoint, handleCloseDialog, mutate])

    const handleDelete = React.useCallback(async (id: string | number) => {
        if (!confirm("Are you sure you want to delete this item?")) return
        try {
            if (!endpoint) throw new Error("Cannot delete without a CRUD endpoint")
            await apiClient.delete(endpoint, { params: { id } })
            mutate()
        } catch {
            toast.error("Failed to delete data")
        }
    }, [endpoint, mutate])

    // Sort helper that also resets page to avoid double requests
    const updateSorts = React.useCallback((updater: SortEntry[] | ((prev: SortEntry[]) => SortEntry[])) => {
        setSorts(updater)
        setPage(1)
    }, [])

    const result = React.useMemo(() => ({
        data,
        isLoading,
        isValidating,
        search,
        setSearch,
        debouncedSearch,
        page,
        setPage,
        pageSize,
        setPageSize,
        total,
        sorts,
        updateSorts,
        isDialogOpen,
        editingItem,
        isSaving,
        handleOpenDialog,
        handleCloseDialog,
        handleSave,
        handleDelete,
        mutate
    }), [
        data, isLoading, isValidating, search, debouncedSearch,
        page, pageSize, total, sorts, updateSorts,
        isDialogOpen, editingItem, isSaving, mutate,
        handleOpenDialog, handleCloseDialog, handleSave, handleDelete
    ])

    return result
}
