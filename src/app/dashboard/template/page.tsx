"use client"

import * as React from "react"
import { Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api"
import { useCrud } from "@/hooks/use-crud"
import { CrudLayout, type ItemsRenderProps } from "@/components/common/crud-layout"
import { type SearchFilterItem } from "@/components/common/query-filters"
import { ActionButtons } from "@/components/common/action-buttons"

import { TaskDialog } from "@/components/template/task-dialog"

type Template = {
    id: string | number
    title: string
    description: string
    expression: string
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

    const TemplateCards = ({ items }: ItemsRenderProps<Template>) => (
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
                        <ActionButtons 
                            onEdit={() => handleOpenCrud(item)}
                            onConfirmDelete={async () => {
                                await apiClient.delete('/quants/template', { params: { id: item.id } })
                                mutate()
                            }}
                            description={<>Are you sure you want to delete the template <strong>{item.title}</strong>? This action cannot be undone.</>}
                        />
                    </CardFooter>
                </Card>
            ))}
            {items.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">No templates found.</div>
            )}
        </div>
    )

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
