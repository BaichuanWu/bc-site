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

type Alpha = {
    id: string | number
    wqbAlphaId: string
    expression: string
    sharpe: number
    fitness: number
    margin: number
    turnover: number
    wqbTypName: string
    state: number
    pc: number
    failCount: number
}

const getStateBadge = (state: number) => {
    switch (state) {
        case 0: return <Badge variant="outline">Initialized</Badge>
        case 5: return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Backtesting</Badge>
        case 8: return <Badge variant="destructive">Failed</Badge>
        case 10: return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Backtested</Badge>
        case 20: return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Submitted</Badge>
        default: return <Badge variant="outline">Unknown ({state})</Badge>
    }
}

export default function AlphaPage() {
    const filterItems: SearchFilterItem[] = [
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
                { label: "Backtesting (5)", value: 5 },
                { label: "Failed (8)", value: 8 },
                { label: "Backtested (10)", value: 10 },
                { label: "Submitted (20)", value: 20 },
            ]
        },
        { key: "sharpe", label: "Sharpe Constraints", type: "number" },
        { key: "fitness", label: "Fitness Score", type: "number" },
        { key: "margin", label: "Margin Filter", type: "number" },
        { key: "turnover", label: "Turnover", type: "number" },
        { key: "wqbAlphaId", label: "WQB ID", type: "text" },
        { key: "expression", label: "Expression", type: "text" },
        { key: "pc", label: "Production Corr (PC)", type: "number" },
        { key: "failCount", label: "Fail Count Limit", type: "number" },
    ]

    const columns: Column<Alpha>[] = [
        { key: "id", title: "ID", width: 80, className: "text-slate-500 font-medium" },
        { key: "wqbAlphaId", title: "WQB ID", width: 120, className: "font-semibold", fixed: 'left' },
        {
            key: "expression",
            title: "Expression",
            width: 300,
            truncate: true,
            className: "font-mono text-[10px] sm:text-xs",
        },
        { key: "sharpe", title: "Sharpe", align: 'right', render: (val) => (Number(val) || 0).toFixed(2) },
        { key: "fitness", title: "Fitness", align: 'right', render: (val) => (Number(val) || 0).toFixed(2) },
        { key: "margin", title: "Margin", align: 'right', render: (val) => (Number(val) || 0).toFixed(4) },
        { key: "turnover", title: "Turnover", align: 'right', render: (val) => (Number(val) || 0).toFixed(4) },
        { key: "pc", title: "PC", align: 'right', render: (val) => (Number(val) || 0).toFixed(4) },
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
        }
    ]

    return (
        <CrudLayout<Alpha>
            title="Alphas Query Panel"
            description="Interactive filter panel for multidimensional search over WQB metrics."
            endpoint="/quants/wqb/alpha"
            idKey="wqbAlphaId"
            filterItems={filterItems}
            storageKey="alpha-page-filters"
            columns={columns}
        />
    )
}



