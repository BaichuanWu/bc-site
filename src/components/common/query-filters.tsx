import * as React from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Filter, Search, RotateCcw, Save, BookOpen, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

export type FilterOperator = 'eq' | 'neq' | 'gt' | 'ge' | 'lt' | 'le' | 'between' | 'in' | 'not_in' | 'like' | 'ilike' | 'regexp'

export interface SearchFilterItem {
    key: string
    label: string
    type?: 'text' | 'number'
    options?: { label: string, value: string | number }[]
}

type FilterValue =
    | string
    | number
    | null
    | Array<string | number | null>
    | undefined

export type FilterClause = Record<string, FilterValue>

interface DynamicFilterProps {
    label: string
    value: FilterClause | undefined
    onChange: (val: FilterClause | undefined) => void
    options?: { label: string, value: string | number }[]
    type?: 'text' | 'number'
}

const OPERATORS: { value: FilterOperator, label: string }[] = [
    { value: 'eq', label: '=' },
    { value: 'neq', label: '!=' },
    { value: 'gt', label: '>' },
    { value: 'ge', label: '>=' },
    { value: 'lt', label: '<' },
    { value: 'le', label: '<=' },
    { value: 'between', label: '~' },
    { value: 'like', label: 'LK' },
    { value: 'regexp', label: 'RE' },
    { value: 'in', label: 'IN' },
]

export function DynamicFilter({ label, value, onChange, options, type = 'text' }: DynamicFilterProps) {
    // Determine current operator
    const currentOp = value ? (Object.keys(value)[0] as FilterOperator) : 'eq'
    const currentVal = value ? value[currentOp] : undefined

    // Option 1: Multi-selector enforcing native "in" query when options are active
    if (options) {
        const selectedValues = Array.isArray(value?.in) ? value.in : []

        const toggleOption = (optVal: string | number) => {
            const newValues = selectedValues.includes(optVal)
                ? selectedValues.filter(v => v !== optVal)
                : [...selectedValues, optVal]

            if (newValues.length === 0) {
                onChange(undefined)
            } else {
                onChange({ in: newValues })
            }
        }

        return (
            <div className="flex w-[190px] flex-col gap-1">
                <Label className="text-[11px] font-medium text-muted-foreground">{label}</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="h-9 justify-between px-3 text-left text-xs font-normal">
                            {selectedValues.length === 0 ? (
                                <span className="text-muted-foreground text-xs">Select {label}...</span>
                            ) : (
                                <div className="flex gap-1 overflow-hidden">
                                    {selectedValues.slice(0, 2).map(val => {
                                        const opt = options.find(o => String(o.value) === String(val))
                                        return <Badge variant="secondary" key={val} className="truncate px-1 py-0">{opt?.label ?? val}</Badge>
                                    })}
                                    {selectedValues.length > 2 && (
                                        <Badge variant="secondary" className="px-1 py-0">+{selectedValues.length - 2}</Badge>
                                    )}
                                </div>
                            )}
                            <ChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[220px] p-0" align="start">
                        <div className="max-h-[280px] space-y-1 overflow-y-auto bg-card p-2">
                            {options.map((opt) => (
                                <label key={opt.value} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-muted">
                                    <Checkbox
                                        checked={selectedValues.includes(opt.value)}
                                        onCheckedChange={() => toggleOption(opt.value)}
                                        className="rounded-sm"
                                    />
                                    <span className="text-xs font-medium text-foreground">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        )
    }

    // Option 2: Generic Operation Builder
    const onOpChange = (newOp: string) => {
        if (newOp === 'between') {
            onChange({ between: [null, null] })
        } else {
            // Retain old value if possible, else empty
            const fallback = currentOp !== 'between' ? currentVal : ''
            onChange({ [newOp]: fallback !== undefined ? fallback : '' })
        }
    }

    const onValChange = (newVal: string | number | null | undefined) => {
        if (newVal === '' || newVal == null) {
            onChange(undefined)
            return
        }

        if (currentOp === 'in') {
            const arr = String(newVal).split(',').map(s => s.trim()).filter(Boolean)
            onChange({ in: type === 'number' ? arr.map(Number).filter(n => !isNaN(n)) : arr })
        } else if (type === 'number') {
            onChange({ [currentOp]: Number(newVal) })
        } else {
            onChange({ [currentOp]: newVal })
        }
    }

    return (
        <div className="flex w-[190px] flex-col gap-1">
            <Label className="text-[11px] font-medium text-muted-foreground">{label}</Label>
            <div className="flex items-center overflow-hidden rounded-md border border-input bg-card shadow-sm transition-shadow hover:shadow-sm focus-within:ring-1 focus-within:ring-indigo-400">
                <Select value={currentOp} onValueChange={onOpChange}>
                    <SelectTrigger className="flex h-[34px] w-[48px] shrink-0 justify-center rounded-none border-0 border-r border-border bg-muted/50 px-1 text-xs text-foreground focus:ring-0">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {OPERATORS.map(op => (
                            <SelectItem key={op.value} value={op.value} className="text-xs">
                                {op.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {currentOp === 'between' ? (
                    <div className="flex h-[34px] flex-1 items-center bg-card">
                        <Input
                            type={type}
                            className="h-full w-1/2 rounded-none border-0 px-1 text-center text-xs text-foreground focus-visible:ring-0"
                            placeholder="Min"
                            value={Array.isArray(currentVal) ? currentVal[0] ?? '' : ''}
                            onChange={(e) => {
                                const arr = Array.isArray(currentVal) ? [...currentVal] : [null, null]
                                arr[0] = type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value
                                onChange({ between: arr })
                            }}
                        />
                        <div className="w-[1px] h-3 bg-border shrink-0" />
                        <Input
                            type={type}
                            className="h-full w-1/2 rounded-none border-0 px-1 text-center text-xs text-foreground focus-visible:ring-0"
                            placeholder="Max"
                            value={Array.isArray(currentVal) ? currentVal[1] ?? '' : ''}
                            onChange={(e) => {
                                const arr = Array.isArray(currentVal) ? [...currentVal] : [null, null]
                                arr[1] = type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value
                                onChange({ between: arr })
                            }}
                        />
                    </div>
                ) : (
                    <Input
                        type={currentOp === 'in' ? 'text' : type}
                        className="h-[34px] flex-1 rounded-none border-0 px-3 text-center text-xs text-foreground shadow-none focus-visible:ring-0"
                        placeholder={currentOp === 'in' ? '1, 2, 3...' : 'Value...'}
                        value={
                            currentOp === 'in' && Array.isArray(currentVal)
                                ? currentVal.map((item) => String(item ?? '')).join(', ')
                                : (typeof currentVal === 'string' || typeof currentVal === 'number' ? currentVal : '')
                        }
                        onChange={(e) => onValChange(e.target.value)}
                    />
                )}
            </div>
        </div>
    )
}

interface SearchFilterGroupProps {
    items: SearchFilterItem[]
    onSearch: (filters: Record<string, FilterClause>) => void
    storageKey?: string
    title?: string
    initialFilters?: Record<string, FilterClause>
}

type FilterTemplates = Record<string, Record<string, FilterClause>>
const EMPTY_FILTERS: Record<string, FilterClause> = {}

export function resolveInitialFilterState(
    storageKey?: string,
    initialFilters: Record<string, FilterClause> = EMPTY_FILTERS
) {
    if (typeof window === "undefined" || !storageKey) {
        return initialFilters
    }

    const saved = window.localStorage.getItem(storageKey)
    if (!saved) {
        return initialFilters
    }

    try {
        return JSON.parse(saved) as Record<string, FilterClause>
    } catch (e) {
        console.error("Failed to parse saved filters", e)
        return initialFilters
    }
}

export function SearchFilterGroup({
    items,
    onSearch,
    storageKey,
    title = "Search Filters",
    initialFilters = EMPTY_FILTERS
}: SearchFilterGroupProps) {
    const [tempFilters, setTempFilters] = React.useState<Record<string, FilterClause>>(() =>
        resolveInitialFilterState(storageKey, initialFilters)
    )
    const [isVisible, setIsVisible] = React.useState(true)
    const [templates, setTemplates] = React.useState<FilterTemplates>({})
    const [newTemplateName, setNewTemplateName] = React.useState("")
    const [isSaveOpen, setIsSaveOpen] = React.useState(false)

    const templatesKey = storageKey ? `${storageKey}_templates` : null

    React.useEffect(() => {
        if (templatesKey) {
            const savedTemplates = localStorage.getItem(templatesKey)
            if (savedTemplates) {
                try {
                    setTemplates(JSON.parse(savedTemplates) as FilterTemplates)
                } catch (e) {
                    console.error("Failed to parse templates", e)
                }
            }
        }
    }, [templatesKey])

    const updateFilter = (key: string, value: FilterClause | undefined) => {
        setTempFilters(prev => {
            const next = { ...prev }
            if (value === undefined) {
                delete next[key]
            } else {
                next[key] = value
            }
            return next
        })
    }

    const handleSearch = () => {
        if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(tempFilters))
        }
        onSearch(tempFilters)
    }

    const handleReset = () => {
        setTempFilters({})
        if (storageKey) {
            localStorage.removeItem(storageKey)
        }
        onSearch({})
    }

    const saveTemplate = () => {
        if (!newTemplateName.trim() || !templatesKey) return

        const updatedTemplates = {
            ...templates,
            [newTemplateName.trim()]: tempFilters
        }

        setTemplates(updatedTemplates)
        localStorage.setItem(templatesKey, JSON.stringify(updatedTemplates))
        setNewTemplateName("")
        setIsSaveOpen(false)
    }

    const loadTemplate = (name: string) => {
        const filters = templates[name]
        if (filters) {
            setTempFilters(filters)
            if (storageKey) {
                localStorage.setItem(storageKey, JSON.stringify(filters))
            }
            onSearch(filters)
        }
    }

    const deleteTemplate = (name: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!templatesKey) return

        const { [name]: deletedTemplate, ...rest } = templates
        void deletedTemplate
        setTemplates(rest)
        localStorage.setItem(templatesKey, JSON.stringify(rest))
    }

    const hasTemplates = Object.keys(templates).length > 0

    return (
        <Card className="border-border shadow-none">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-y-2 space-y-0 border-b border-border bg-muted/20 px-3 py-2 text-card-foreground">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
                    </div>

                    {storageKey && (
                        <div className="flex items-center gap-2 sm:border-l sm:border-border sm:pl-4">
                            {hasTemplates && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-7 text-xs font-normal border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-all cursor-pointer active:scale-95">
                                            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                                            <span className="hidden xs:inline">Load Template</span>
                                            <span className="xs:hidden">Load</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56">
                                        <DropdownMenuLabel className="text-xs">Saved Templates</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {Object.keys(templates).map(name => (
                                            <DropdownMenuItem
                                                key={name}
                                                onClick={() => loadTemplate(name)}
                                                className="flex justify-between items-center group cursor-pointer hover:bg-muted transition-colors"
                                            >
                                                <span className="truncate flex-1">{name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity cursor-pointer"
                                                    onClick={(e) => deleteTemplate(name, e)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            <Popover open={isSaveOpen} onOpenChange={setIsSaveOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-7 text-xs font-normal border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all cursor-pointer active:scale-95">
                                        <Save className="mr-1.5 h-3.5 w-3.5" />
                                        <span className="hidden xs:inline">Save Template</span>
                                        <span className="xs:hidden">Save</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-3" align="start">
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-medium leading-none">Save Template</h4>
                                            <p className="text-xs text-muted-foreground">Enter a name for current filters.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Template name..."
                                                value={newTemplateName}
                                                onChange={(e) => setNewTemplateName(e.target.value)}
                                                className="h-8 text-xs"
                                                onKeyDown={(e) => e.key === 'Enter' && saveTemplate()}
                                                autoFocus
                                            />
                                            <Button size="sm" className="h-8 text-xs px-2 cursor-pointer transition-all active:scale-95 shadow-sm hover:shadow-md" onClick={saveTemplate}>Save</Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                    <div className="flex items-center gap-2 border-r border-border pr-2 mr-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            className="text-xs h-7 px-2 sm:px-3 cursor-pointer hover:bg-muted transition-all active:scale-95 border-border text-foreground"
                        >
                            <RotateCcw className="sm:mr-1.5 h-3 w-3" />
                            <span className="hidden xs:inline">Reset</span>
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSearch}
                            className="text-xs h-7 px-3 sm:px-4 bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer active:scale-95 shadow-sm hover:shadow-md"
                        >
                            <Search className="sm:mr-1.5 h-3 w-3" />
                            <span className="hidden xs:inline">Search</span>
                        </Button>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 cursor-pointer hover:bg-muted transition-colors rounded-full text-foreground"
                        onClick={() => setIsVisible(!isVisible)}
                    >
                        {isVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </CardHeader>
            {isVisible && (
                <CardContent className="animate-in fade-in slide-in-from-top-1 px-3 py-3 duration-300">
                    <div className="flex flex-wrap gap-x-3 gap-y-2">
                        {items.map((item) => (
                            <DynamicFilter
                                key={item.key}
                                label={item.label}
                                value={tempFilters[item.key]}
                                onChange={(v) => updateFilter(item.key, v)}
                                options={item.options}
                                type={item.type}
                            />
                        ))}
                    </div>
                </CardContent>
            )}
        </Card>
    )
}
