import * as React from "react"
import useSWR from "swr"
import { apiClient, fetcher } from "@/lib/api"

export type SortEntry = { key: string; dir: 'asc' | 'desc' }

export function useCrud<T extends { id: string | number }>(
    endpoint: string,
    searchParamName?: string,
    additionalQueries: Record<string, string | number> = {}
) {
    const [search, setSearch] = React.useState("")
    const [debouncedSearch, setDebouncedSearch] = React.useState("")
    const [page, setPage] = React.useState(1)
    const [pageSize, setPageSize] = React.useState(20)
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
        const qPayload: Record<string, any> = {}

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
            let cleanKey = searchParamName.replace(/Regexp|Like|_regexp|_like/g, '')
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

    const swrKey = `${endpoint}?${queryParamsString}`

    React.useEffect(() => {
        console.log(`[useCrud] Key changed: ${swrKey}`)
    }, [swrKey])

    const { data: resultData, mutate, isLoading, isValidating } = useSWR(
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

    const data: T[] = Array.isArray(resultData?.dataSource)
        ? resultData.dataSource
        : Array.isArray(resultData?.data)
            ? resultData.data
            : Array.isArray(resultData)
                ? resultData
                : []

    const total = resultData?.total || resultData?.totalCount || 0

    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<T | null>(null)
    const [isSaving, setIsSaving] = React.useState(false)

    const handleOpenDialog = (item?: T) => {
        setEditingItem(item || null)
        setIsDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
        setEditingItem(null)
    }

    const handleSave = async (payload: Partial<T>) => {
        try {
            setIsSaving(true)
            if (editingItem) {
                await apiClient.put(endpoint, { ...payload, id: editingItem.id })
            } else {
                await apiClient.post(endpoint, payload)
            }
            handleCloseDialog()
            mutate()
        } catch (e) {
            alert("Failed to save data")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string | number) => {
        if (!confirm("Are you sure you want to delete this item?")) return
        try {
            await apiClient.delete(endpoint, { params: { id } })
            mutate()
        } catch (e) {
            alert("Failed to delete data")
        }
    }

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
        isDialogOpen, editingItem, isSaving, mutate
    ])

    return result
}
