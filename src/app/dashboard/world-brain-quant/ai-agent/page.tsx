'use client'

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Sparkles, Database, LayoutPanelLeft } from "lucide-react"
import { RunWorkflowDialog } from "@/components/workflow/run-workflow-dialog"

export default function AgentWorkflowPage() {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)

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
                            <Badge variant="outline" className="text-[10px] font-mono opacity-60">
                                v3.0.0
                            </Badge>
                        </div>
                        <CardTitle className="text-xl font-black uppercase tracking-tight">
                            Cluster Nuggets Flow
                        </CardTitle>
                        <CardDescription className="text-xs font-semibold text-muted-foreground/80">
                            End-to-end pipeline: Resource fetching -&gt; Semantic Clustering -&gt; Idea Generation -&gt; Alpha Assembly.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded-lg bg-muted/30 border border-muted/50">
                                <span className="block text-[10px] uppercase font-bold text-muted-foreground/60 mb-1">Architecture</span>
                                <span className="text-xs font-black">Stateless v3</span>
                            </div>
                            <div className="p-2 rounded-lg bg-muted/30 border border-muted/50">
                                <span className="block text-[10px] uppercase font-bold text-muted-foreground/60 mb-1">Validation</span>
                                <span className="text-xs font-black italic">Strict AST</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[11px] font-medium leading-relaxed opacity-80">
                                This workflow uses **Reflective Agents** to analyze datafield clusters and assemble formulaic alphas with mandatory vector operator wrapping.
                            </p>
                        </div>
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

            <RunWorkflowDialog 
                open={isDialogOpen} 
                onOpenChange={setIsDialogOpen} 
                workflowName="cluster_nuggets_v3"
                title="Nugget Workflow (v3)"
            />
        </div>
    )
}
