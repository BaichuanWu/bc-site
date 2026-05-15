'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Activity,
    ActivityIcon,
    Loader2Icon,
    ChevronRightIcon
} from 'lucide-react'
import { CrudLayout, type ItemsRenderProps } from '@/components/common/crud-layout'
import { type SearchFilterItem } from '@/components/common/query-filters'

import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/date-utils'
import { useMeta } from '@/hooks/use-meta'
import { TASK_STATE } from '@/lib/constants'
import { getStatusColor, mapServerStateToStatus } from '@/lib/task-utils'
import { WorkspaceLink } from '@/components/workspace/workspace-link'
import { useWorkspaceTabTitle } from '@/hooks/use-workspace-tab-title'

// --- Types ---

interface TaskItemProps {
    task: SystemTaskListItem
}

type SystemTaskListItem = {
    id: number
    name: string
    displayName?: string
    state: number
    stateName: string
    typName: string
    progress: number
    message?: string
    createTime?: string
}

import { TaskProgressBar } from '@/components/common/task-progress-bar'

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
    const id = task.id
    const displayName = task.displayName || task.name

    // Use standardized names from backend (CamelCase)
    const stateName = task.stateName
    const typName = task.typName

    return (
        <Card className="mb-4 overflow-hidden border-l-4 transition-all hover:shadow-lg bg-card/50 backdrop-blur-sm group flex flex-col h-full" style={{ borderLeftColor: task.state === TASK_STATE.RUNNING ? 'rgb(59 130 246)' : 'transparent' }}>
            <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0 gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider px-1.5 h-4 opacity-70 shrink-0">
                            {typName}
                        </Badge>
                        <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2 min-w-0">
                            <span className="truncate">{displayName}</span>
                            {task.state === TASK_STATE.RUNNING && <ActivityIcon className="h-3 w-3 text-blue-500 animate-pulse shrink-0" />}
                        </CardTitle>
                    </div>
                    <CardDescription className="text-[10px] font-mono opacity-60 truncate" title={`${id} • ${formatDateTime(task.createTime, "")}`}>
                        ID: {id} {task.createTime && `• ${formatDateTime(task.createTime, "")}`}
                    </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 whitespace-nowrap", getStatusColor(task.state))}>
                        {task.state === TASK_STATE.RUNNING && <Loader2Icon className="mr-1 h-2.5 w-2.5 animate-spin" />}
                        {stateName}
                    </Badge>
                    <WorkspaceLink href={`/dashboard/sys-task/${id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-tighter gap-1 opacity-0 group-hover:opacity-100 transition-all px-2">
                            Details
                            <ChevronRightIcon className="h-3.5 w-3.5" />
                        </Button>
                    </WorkspaceLink>
                </div>
            </CardHeader>
            <CardContent className="pb-4 mt-auto">
                <TaskProgressBar
                    taskId={id}
                    initialData={{
                        progress: { percent: task.progress, message: task.message },
                        status: mapServerStateToStatus(task.state)
                    }}
                />
            </CardContent>
        </Card>
    )
}

const TaskCardGrid: React.FC<ItemsRenderProps<SystemTaskListItem>> = ({ items }) => {
    if (!items || items.length === 0) {
        return (
            <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/5 italic text-sm text-muted-foreground">
                No tasks match your current criteria.
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map(task => (
                <TaskItem key={task.id} task={task} />
            ))}
        </div>
    )
}

// --- Main Page ---

export default function SystemTaskPage() {
    const { getOptions, isLoading } = useMeta()
    useWorkspaceTabTitle("/dashboard/sys-task", "System Tasks")

    const filterItems: SearchFilterItem[] = [
        { key: "name", label: "Task Name", type: "text" },
        {
            key: "typ",
            label: "Type",
            type: "number",
            options: getOptions('SystemTask', 'TYP_NAME_MAPPING')
        },
        {
            key: "state",
            label: "State",
            type: "number",
            options: getOptions('SystemTask', 'STATE_NAME_MAPPING')
        }
    ]

    if (isLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2Icon className="h-8 w-8 animate-spin opacity-20" />
            </div>
        )
    }

    return (
        <CrudLayout<SystemTaskListItem>
            icon={Activity}
            title="System Tasks"
            endpoint="/sys/tasks"
            filterItems={filterItems}
            storageKey="sys-task-filters"
            itemsRender={TaskCardGrid}
            stickyTop={0}
        />
    )
}
