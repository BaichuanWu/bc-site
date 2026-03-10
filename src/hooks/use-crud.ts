import * as React from "react"
import useSWR from "swr"
import { apiClient, fetcher } from "@/lib/api"

export function useCrud<T extends { id: string | number }>(
    endpoint: string,
    searchParamName?: string,
    additionalQueries: Record<string, string | number> = {}
) {
    const [search, setSearch] = React.useState("")
    const [debouncedSearch, setDebouncedSearch] = React.useState("")
    const [page, setPage] = React.useState(1)
    const [pageSize, setPageSize] = React.useState(20)

    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(timer)
    }, [search])

    // Reset pagination on search change
    React.useEffect(() => {
        setPage(1)
    }, [debouncedSearch, additionalQueries])

    const queryParams = new URLSearchParams()
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
        // Strip out old suffixes if dev forgot to remove them
        let cleanKey = searchParamName.replace(/Regexp|Like|_regexp|_like/g, '')
        qPayload[cleanKey] = { like: `%${debouncedSearch}%` }
    }

    if (Object.keys(qPayload).length > 0) {
        queryParams.set("q", JSON.stringify(qPayload))
    }

    // Pagination params (skip and limit)
    const skip = (page - 1) * pageSize
    queryParams.set("skip", String(skip))
    queryParams.set("limit", String(pageSize))

    const { data: resultData, mutate, isLoading, isValidating } = useSWR(
        `${endpoint}?${queryParams.toString()}`,
        fetcher,
        { keepPreviousData: true }
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

    return {
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
        isDialogOpen,
        editingItem,
        isSaving,
        handleOpenDialog,
        handleCloseDialog,
        handleSave,
        handleDelete,
        mutate
    }
}
