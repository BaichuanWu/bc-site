"use client"

import * as React from "react"
import { Edit, Trash2, Settings, Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { apiClient } from "@/lib/api"
import { useCrud } from "@/hooks/use-crud"
import { CrudLayout, type ItemsRenderProps } from "@/components/common/crud-layout"
import { type SearchFilterItem } from "@/components/common/query-filters"

type Template = {
    id: string | number
    title: string
    description: string
    expression: string
}

const FORM_FIELDS = [
    { name: 'instrumentType', label: 'Instrument Type' },
    { name: 'region', label: 'Region' },
    { name: 'universe', label: 'Universe' },
    { name: 'delay', label: 'Delay' },
    { name: 'decay', label: 'Decay' },
    { name: 'neutralization', label: 'Neutralization' },
    { name: 'truncation', label: 'Truncation' },
    { name: 'pasteurization', label: 'Pasteurization' },
    { name: 'testPeriod', label: 'Test Period' },
    { name: 'unitHandling', label: 'Unit Handling' },
    { name: 'nanHandling', label: 'NaN Handling' },
    { name: 'maxTrade', label: 'Max Trade' },
    { name: 'language', label: 'Language' },
    { name: 'visualization', label: 'Visualization' },
]

// -- Task Dialog Components --
const parseTemplate = (content: string) => {
    const parts: Array<{ type: 'text' | 'token'; text?: string; name?: string }> = []
    if (!content) return parts
    const re = /<([a-zA-Z0-9_:-]+)\/>/g
    let lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(content)) !== null) {
        const idx = m.index
        if (idx > lastIndex) parts.push({ type: 'text', text: content.slice(lastIndex, idx) })
        parts.push({ type: 'token', name: m[1] })
        lastIndex = re.lastIndex
    }
    if (lastIndex < content.length) parts.push({ type: 'text', text: content.slice(lastIndex) })
    return parts
}

function TokenChip({
    tokenName,
    bindings,
    onSave
}: {
    tokenName: string,
    bindings: Record<string, string[]>,
    onSave: (name: string, val: string[]) => void
}) {
    const [open, setOpen] = React.useState(false)
    const [inputVal, setInputVal] = React.useState((bindings[tokenName] || []).join(","))

    // Update input when token opens if bindings changed externally
    React.useEffect(() => {
        if (open) setInputVal((bindings[tokenName] || []).join(","))
    }, [open, bindings, tokenName])

    const valArr = bindings[tokenName] || []
    const hasValue = valArr.length > 0 && valArr[0] !== ""

    let label = `<${tokenName}/>`
    if (hasValue) {
        label = valArr.length > 1 ? `${valArr[0]}等${valArr.length}个` : valArr[0]
    }

    const handleSaveToken = () => {
        onSave(tokenName, inputVal.split(",").map(s => s.trim()).filter(Boolean))
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Badge
                    variant={hasValue ? "default" : "outline"}
                    className="mx-1 cursor-pointer font-mono text-sm inline-block"
                >
                    {label}
                </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4">
                <div className="space-y-4">
                    <h4 className="font-medium text-sm leading-none">{tokenName} Binding</h4>
                    <Input
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        placeholder="Enter comma separated values..."
                    />
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleSaveToken}>Save</Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

function TaskDialog({
    open,
    onOpenChange,
    template
}: {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    template: Template | null
}) {
    const [bindings, setBindings] = React.useState<Record<string, string[]>>({})
    const [formData, setFormData] = React.useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    React.useEffect(() => {
        if (open) {
            setBindings({})
            setFormData({})
        }
    }, [open])

    const parts = React.useMemo(() => parseTemplate(template?.expression || ""), [template])

    const handleSaveBinding = (name: string, val: string[]) => {
        setBindings(prev => ({ ...prev, [name]: val }))
    }

    const handleFormChange = (name: string, val: string) => {
        setFormData(prev => ({ ...prev, [name]: val }))
    }

    const handleCreateTask = async () => {
        try {
            setIsSubmitting(true)
            const payload = {
                ...formData,
                fieldData: bindings,
                template_id: template?.id,
            }
            await apiClient.post(`/quants/wqb/alpha-task`, payload)
            alert("Task parameters saved and testing started!")
            onOpenChange(false)
        } catch (e) {
            alert("Failed to submit task")
            console.error(e)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Task Parameters: {template?.title}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Expression Bindings</h3>
                        <div className="p-4 rounded-md border bg-muted/30 font-mono whitespace-pre-wrap leading-relaxed">
                            {parts.map((p, idx) => (
                                p.type === 'text'
                                    ? <span key={idx}>{p.text}</span>
                                    : <TokenChip key={idx} tokenName={p.name!} bindings={bindings} onSave={handleSaveBinding} />
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {FORM_FIELDS.map(f => (
                            <div key={f.name} className="grid gap-2">
                                <Label htmlFor={f.name}>{f.label}</Label>
                                <Input
                                    id={f.name}
                                    value={formData[f.name] || ""}
                                    onChange={(e) => handleFormChange(f.name, e.target.value)}
                                    placeholder={`Enter ${f.label.toLowerCase()}...`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleCreateTask} disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save & Test Bindings"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// -- Main Page component --
export default function TemplatePage() {
    const {
        isDialogOpen: isCrudDialogOpen,
        editingItem,
        isSaving,
        handleOpenDialog: handleOpenCrud,
        handleCloseDialog: handleCloseCrud,
        handleSave,
        handleDelete,
        mutate
    } = useCrud<Template>('/quants/template')

    const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false)
    const [taskItem, setTaskItem] = React.useState<Template | null>(null)

    // Form State
    const [title, setTitle] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [expression, setExpression] = React.useState("")

    React.useEffect(() => {
        if (isCrudDialogOpen) {
            setTitle(editingItem?.title || "")
            setDescription(editingItem?.description || "")
            setExpression(editingItem?.expression || "")
        }
    }, [isCrudDialogOpen, editingItem])

    const onSave = async () => {
        await handleSave({ title, description, expression })
    }

    const handleOpenTask = (item: Template) => {
        setTaskItem(item)
        setIsTaskDialogOpen(true)
    }

    const TemplateCards = React.useCallback(({ items }: ItemsRenderProps<Template>) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
                <Card key={item.id} className="flex flex-col group hover:shadow-md transition-all">
                    <CardHeader className="pb-3">
                        <CardTitle className="line-clamp-1 text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                        </p>
                        <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap" title={item.expression}>
                            {item.expression}
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end gap-2 border-t pt-4">
                        <Button variant="outline" size="sm" onClick={() => handleOpenTask(item)}>
                            <Settings className="mr-2 h-4 w-4" /> Configure
                        </Button>
                        <div className="flex-1"></div>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenCrud(item)}>
                            <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </CardFooter>
                </Card>
            ))}
            {items.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">No templates found.</div>
            )}
        </div>
    ), [handleOpenCrud, handleDelete])

    const filterItems: SearchFilterItem[] = [
        { key: "title", label: "Title", type: "text" },
    ]

    return (
        <CrudLayout<Template>
            title="Alpha Template"
            description="Manage templates for generating quantitative alphas."
            endpoint="/quants/template"
            addButtonLabel="Add Template"
            onAdd={() => handleOpenCrud()}
            itemsRender={TemplateCards}
            filterItems={filterItems}
            storageKey="template-page-filters"
        >
            {/* CRUD Dialog */}
            <Dialog open={isCrudDialogOpen} onOpenChange={(open) => !open && handleCloseCrud()}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Template' : 'Create Template'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="expression">Expression (use &lt;token/&gt; syntax)</Label>
                            <Textarea
                                id="expression"
                                value={expression}
                                onChange={e => setExpression(e.target.value)}
                                className="font-mono min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseCrud}>Cancel</Button>
                        <Button onClick={onSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Task Dialog */}
            <TaskDialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen} template={taskItem} />
        </CrudLayout>
    )
}
