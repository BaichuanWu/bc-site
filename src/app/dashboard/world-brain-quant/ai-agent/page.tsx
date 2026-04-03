'use client'

import * as React from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot, GitBranch, Play, Sparkles, Database, LayoutPanelLeft } from "lucide-react"
import { QuantWorkflowRunDialog } from "@/components/workflow/dialogs/quant-workflow-run-dialog"
import { apiClient } from "@/lib/api"
import { getJsonArray, getJsonObject, getJsonString } from "@/types/json"

type WorkflowNodeMeta = {
    node_name: string
    agent_version_id: number | null
    agent_name: string
    agent_version: string
    agent_class: string
}

type WorkflowMeta = {
    definitionJson?: {
        nodes?: WorkflowNodeMeta[]
    }
    name: string
    title: string
    version: string
    description: string
}

export default function AgentWorkflowPage() {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const { data: activeVersions } = useSWR<Array<{
        id: number
        name: string
        version: string
        agent_class: string
    }>>(
        "/agent/active-versions",
        async (url: string) => {
            const res = await apiClient.get(url)
            return (getJsonArray(res) ?? []).map((item) => {
                const obj = getJsonObject(item)
                return {
                    id: Number(obj?.id ?? 0),
                    name: getJsonString(obj?.name),
                    version: getJsonString(obj?.version),
                    agent_class: getJsonString(obj?.agent_class),
                }
            })
        }
    )
    const { data: workflowMeta } = useSWR<WorkflowMeta>(
        "/workflow-definition/active/cluster_nuggets_v3",
        async (url: string) => {
            const res = await apiClient.get(url)
            const data = getJsonObject(res)
            const definition = getJsonObject(data?.definitionJson)
            const nodeValues = (getJsonArray(definition?.nodes) ?? []).map((node) => {
                const nodeObj = getJsonObject(node)
                return {
                    node_name: getJsonString(nodeObj?.key),
                    agent_version_id: Number(nodeObj?.agent_version_id ?? 0) || null,
                    agent_name: "",
                    agent_version: "",
                    agent_class: "",
                }
            })

            return {
                name: getJsonString(data?.name),
                title: getJsonString(data?.title),
                version: getJsonString(data?.version),
                description: getJsonString(data?.description),
                definitionJson: { nodes: nodeValues },
            }
        }
    )

    const versionLookup = React.useMemo(
        () => new Map((activeVersions || []).map((item) => [item.id, item])),
        [activeVersions]
    )

    if (!workflowMeta) {
        return (
            <div className="p-6">
                <div className="text-sm text-muted-foreground">Loading workflow metadata...</div>
            </div>
        )
    }

    const workflowTitle = workflowMeta.title
    const workflowVersion = workflowMeta.version
    const workflowDescription = workflowMeta.description
    const workflowNodes = (workflowMeta?.definitionJson?.nodes || []).map((node) => {
        const boundVersion = node.agent_version_id ? versionLookup.get(node.agent_version_id) : null
        return {
            ...node,
            agent_name: boundVersion?.name || "-",
            agent_version: boundVersion?.version || "-",
            agent_class: boundVersion?.agent_class || "-",
        }
    })
    const nodeCount = workflowNodes.length || 0

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
                    <Sparkles className="h-8 w-8 text-primary" />
                    AI Agent Workflow Hub
                </h2>
                <p className="text-muted-foreground text-sm font-medium">
                    Orchestrate intelligent quantitative pipelines with autonomous agents.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Nugget Workflow Card */}
                <Card className="flex flex-col group overflow-hidden border-2 transition-all hover:border-primary/50 hover:shadow-xl bg-card/50 backdrop-blur-sm relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Database className="h-24 w-24" />
                    </div>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">
                                Alpha Generation
                            </Badge>
                            {workflowVersion ? (
                                <Badge variant="outline" className="text-[10px] font-mono opacity-60">
                                    v{workflowVersion}
                                </Badge>
                            ) : null}
                        </div>
                        <CardTitle className="text-xl font-black uppercase tracking-tight">
                            {workflowTitle}
                        </CardTitle>
                        <CardDescription className="text-xs font-semibold text-muted-foreground/80">
                            {workflowDescription}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded-lg bg-muted/30 border border-muted/50">
                                <span className="block text-[10px] uppercase font-bold text-muted-foreground/60 mb-1">Source</span>
                                <span className="text-xs font-black">Active Definition</span>
                            </div>
                            <div className="p-2 rounded-lg bg-muted/30 border border-muted/50">
                                <span className="block text-[10px] uppercase font-bold text-muted-foreground/60 mb-1">Nodes</span>
                                <span className="text-xs font-black">{nodeCount}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[11px] font-medium leading-relaxed opacity-80">
                                Workflow metadata, node bindings, and runtime launch configuration are loaded from the active workflow definition stored in the backend.
                            </p>
                        </div>
                        {workflowNodes.length ? (
                            <div className="space-y-3 rounded-xl border bg-background/80 p-3">
                                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    <GitBranch className="h-3.5 w-3.5" />
                                    Node to Agent Mapping
                                </div>
                                <div className="space-y-2">
                                    {workflowNodes.map((node) => (
                                        <div
                                            key={node.node_name}
                                            className="rounded-lg border bg-muted/20 p-2"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-black uppercase tracking-tight">
                                                    {node.node_name}
                                                </span>
                                                <Badge variant="outline" className="text-[10px] font-mono">
                                                    {node.agent_class}
                                                </Badge>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-xs">
                                                <Bot className="h-3.5 w-3.5 text-primary" />
                                                <span className="font-semibold">{node.agent_name}</span>
                                                <span className="text-muted-foreground">v{node.agent_version}</span>
                                            </div>
                                            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                                                agent_version_id: {node.agent_version_id ?? "-"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                    <CardFooter className="pt-4 border-t bg-muted/5 group-hover:bg-muted/10 transition-colors">
                        <Button 
                            className="w-full font-black uppercase tracking-widest h-10 group-hover:px-6 transition-all" 
                            onClick={() => setIsDialogOpen(true)}
                        >
                            <Play className="mr-2 h-4 w-4 fill-current" />
                            Launch Workflow
                        </Button>
                    </CardFooter>
                </Card>

                {/* Placeholder for future workflows */}
                <Card className="border-2 border-dashed bg-transparent opacity-40 grayscale flex flex-col items-center justify-center p-8 text-center gap-4">
                    <LayoutPanelLeft className="h-12 w-12 text-muted-foreground" />
                    <div className="space-y-1">
                        <p className="text-sm font-bold uppercase tracking-tight">More Pipelines Coming</p>
                        <p className="text-[10px] text-muted-foreground font-medium">New AI-driven strategies are under development.</p>
                    </div>
                </Card>
            </div>

            <QuantWorkflowRunDialog 
                open={isDialogOpen} 
                onOpenChange={setIsDialogOpen} 
                workflowName="cluster_nuggets_v3"
                title={workflowVersion ? `${workflowTitle} (v${workflowVersion})` : workflowTitle}
            />
        </div>
    )
}
