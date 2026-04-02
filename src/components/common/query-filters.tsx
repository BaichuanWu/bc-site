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

type FilterClause = Record<string, FilterValue>

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
            <div className="flex flex-col gap-1.5 w-[200px]">
                <Label className="text-xs font-semibold text-slate-600">{label}</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="h-[36px] justify-between text-left font-normal px-3 border-indigo-100 hover:border-indigo-300">
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
                        <div className="p-2 space-y-1 max-h-[280px] overflow-y-auto bg-card">
                            {options.map((opt) => (
                                <label key={opt.value} className="flex items-center gap-2 rounded hover:bg-muted p-2 cursor-pointer transition-colors">
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
        <div className="flex flex-col gap-1.5 w-[200px]">
            <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
            <div className="flex items-center border border-input shadow-sm rounded-md transition-shadow hover:shadow-md focus-within:shadow-md focus-within:ring-1 focus-within:ring-indigo-400 overflow-hidden bg-card">
                <Select value={currentOp} onValueChange={onOpChange}>
                    <SelectTrigger className="w-[48px] h-[32px] rounded-none border-0 border-r border-border focus:ring-0 bg-muted/50 text-xs px-1 shrink-0 flex justify-center text-foreground">
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
                    <div className="flex flex-1 items-center h-[32px] bg-card">
                        <Input
                            type={type}
                            className="h-full border-0 focus-visible:ring-0 rounded-none px-1 w-1/2 text-xs text-center text-foreground"
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
                            className="h-full border-0 focus-visible:ring-0 rounded-none px-1 w-1/2 text-xs text-center text-foreground"
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
                        className="flex-1 h-[32px] rounded-none border-0 focus-visible:ring-0 text-xs shadow-none px-3 text-center text-foreground"
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

export function SearchFilterGroup({
    items,
    onSearch,
    storageKey,
    title = "Search Filters",
    initialFilters = {}
}: SearchFilterGroupProps) {
    const [tempFilters, setTempFilters] = React.useState<Record<string, FilterClause>>(initialFilters)
    const [isVisible, setIsVisible] = React.useState(true)
    const [templates, setTemplates] = React.useState<FilterTemplates>({})
    const [newTemplateName, setNewTemplateName] = React.useState("")
    const [isSaveOpen, setIsSaveOpen] = React.useState(false)

    const templatesKey = storageKey ? `${storageKey}_templates` : null

    // Load from local storage on mount
    React.useEffect(() => {
        if (storageKey) {
            const saved = localStorage.getItem(storageKey)
            if (saved) {
                try {
                    const parsed = JSON.parse(saved) as Record<string, FilterClause>
                    setTempFilters(parsed)
                    // Trigger initial search with saved filters
                    onSearch(parsed)
                } catch (e) {
                    console.error("Failed to parse saved filters", e)
                }
            }
        }

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
    }, [onSearch, storageKey, templatesKey])

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
        <Card className="transition-all duration-300 border-border shadow-none hover:shadow-sm">
            <CardHeader className="py-2 sm:py-1 px-4 flex flex-row flex-wrap items-center justify-between gap-y-2 space-y-0 border-b border-border bg-muted/30 text-card-foreground">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-md font-medium text-foreground">{title}</CardTitle>
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
                <CardContent className="py-2 px-4 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
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
