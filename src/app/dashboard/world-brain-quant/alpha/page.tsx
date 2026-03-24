"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, Filter, Loader2, ChevronLeft, ChevronRight } from "lucide-react"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useCrud } from "@/hooks/use-crud"
import { CrudLayout } from "@/components/common/crud-layout"
import { type Column } from "@/components/common/data-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { SearchFilterGroup, type SearchFilterItem } from "@/components/common/query-filters"
import { AlphaActionMenu } from "@/components/alpha/alpha-action-menu"
import { apiClient } from "@/lib/api"
import { Play } from "lucide-react"

type Alpha = {
    id: string | number
    wqbAlphaId: string
    wqbUrl?: string
    expression: string
    sharpe: number
    fitness: number
    margin: number
    turnover: number
    wqbTypName: string
    state: number
    pc: number
    failCount: number
    parentId?: string | number
    ancestorId?: string | number
}

const getStateBadge = (state: number) => {
    switch (state) {
        case 0: return <Badge variant="outline">Initialized</Badge>
        case 5: return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Simulating</Badge>
        case 8: return <Badge variant="destructive">Failed</Badge>
        case 10: return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Simulated</Badge>
        case 20: return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Submitted</Badge>
        default: return <Badge variant="outline">Unknown ({state})</Badge>
    }
}

import { toast } from "sonner"

export default function AlphaPage() {
    const [currentFilters, setCurrentFilters] = React.useState<Record<string, any>>({})

    const handleBatchSimulate = async () => {
        try {
            const res = await apiClient.post("/quants/wqb/alpha/simulate-batch", currentFilters)
            const taskId = res.data?.task_id
            toast.success("Batch simulation started", {
                description: taskId ? `Task ID: ${taskId}` : undefined
            })
        } catch (e) {
            toast.error("Failed to start batch simulation")
        }
    }

    const filterItems: SearchFilterItem[] = React.useMemo(() => [
        {
            key: "wqbTyp",
            label: "WQB Typ",
            type: "number",
            options: [
                { label: "Regular (0)", value: 0 },
                { label: "Super (10)", value: 10 }
            ]
        },
        {
            key: "state",
            label: "State",
            type: "number",
            options: [
                { label: "Initialized (0)", value: 0 },
                { label: "Simulating (5)", value: 5 },
                { label: "Failed (8)", value: 8 },
                { label: "Simulated (10)", value: 10 },
                { label: "Submitted (20)", value: 20 },
            ]
        },
        { key: "sharpe", label: "Sharpe Constraints", type: "number" },
        { key: "fitness", label: "Fitness Score", type: "number" },
        { key: "margin", label: "Margin Filter", type: "number" },
        { key: "wqbAlphaId", label: "WQB ID", type: "text" },
        { key: "operatorCount", label: "Operator Count", type: "number" },
        { key: "pc", label: "Production Corr (PC)", type: "number" },
        { key: "failCount", label: "Fail Count Limit", type: "number" },
        { key: "warnCount", label: "Warn Count Limit", type: "number" },
        {
            key: "settings.neutralization",
            label: "Neutralization",
            type: "text",
            options: [
                { label: "MARKET", value: "MARKET" },
                { label: "INDUSTRY", value: "INDUSTRY" },
                { label: "SECTOR", value: "SECTOR" },
                { label: "SUBINDUSTRY", value: "SUBINDUSTRY" },
                { label: "FAST", value: "FAST" },
            ]
        },
    ], [])

    const columns: Column<Alpha>[] = React.useMemo(() => [
        { key: "id", title: "ID", width: 80, className: "text-slate-500 font-medium" },
        { 
            key: "wqbAlphaId", 
            title: "WQB ID", 
            width: 120, 
            className: "font-semibold", 
            fixed: 'left',
            render: (val, item) => item.wqbUrl ? (
                <a href={item.wqbUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
                    {val as string}
                </a>
            ) : <>{val}</>
        },
        {
            key: "expression",
            title: "Expression",
            width: 300,
            truncate: true,
            className: "font-mono text-[10px] sm:text-xs",
        },
        { key: "sharpe", title: "Sharpe", align: 'right', sortable: true, render: (val) => (Number(val) || 0).toFixed(2) },
        { key: "operatorCount", title: "Operator Count", align: 'right', sortable: true },
        { key: "failCount", title: "Fail Count", align: 'right', sortable: true },
        { key: "warnCount", title: "Warn Count", align: 'right', sortable: true },
        { key: "fitness", title: "Fitness", align: 'right', sortable: true, render: (val) => (Number(val) || 0).toFixed(2) },
        { key: "margin", title: "Margin (ⱱ)", align: 'right', sortable: true, render: (val) => (Number(val) * 10000 || 0).toFixed(2) },
        { key: "turnover", title: "Turnover", align: 'right', sortable: true, render: (val) => (Number(val) || 0).toFixed(4) },
        { key: "pc", title: "PC", align: 'right', sortable: true, render: (val) => (Number(val) || 0).toFixed(4) },
        {
            key: "wqbTyp",
            title: "Type",
            width: 100,
            render: (_, item) => <Badge variant="outline">{item.wqbTypName || 'Regular (0)'}</Badge>
        },
        {
            key: "state",
            title: "State",
            width: 120,
            render: (val) => getStateBadge(val as number)
        },
        {
            key: "actions" as any,
            title: "Actions",
            width: 80,
            fixed: 'right',
            render: (_, item) => <AlphaActionMenu alpha={item} />
        }
    ], [])

    return (
        <CrudLayout<Alpha>
            title="Alphas Query Panel"
            description="Interactive filter panel for multidimensional search over WQB metrics."
            endpoint="/quants/wqb/alpha"
            idKey="wqbAlphaId"
            filterItems={filterItems}
            storageKey="alpha-page-filters"
            columns={columns}
            onFilterChange={setCurrentFilters}
            addButtonLabel="Simulate Alphas by Query"
            onAdd={handleBatchSimulate}
        >
        </CrudLayout>
    )
}



