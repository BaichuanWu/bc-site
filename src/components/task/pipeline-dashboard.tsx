'use client'

import React, { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2Icon, CheckCircle2Icon, PlayCircleIcon, FastForwardIcon, ZapIcon, ActivityIcon, BrainCircuitIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type TaskEventRecord, type TaskStatus } from '@/types/task'

type PipelineStage = 'idle' | 'planner' | 'generating' | 'round_complete' | 'done'

function getNumber(data: Record<string, unknown>, key: string) {
    const value = data[key]
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function getStage(data: Record<string, unknown>) {
    return typeof data.stage === 'string' ? data.stage : undefined
}

export function PipelineDashboard({ events, status }: { events: TaskEventRecord[], status: TaskStatus }) {
    // Process events to determine pipeline state
    const pipelineState = useMemo(() => {
        const state = {
            enhancerWorkers: 0,
            round: 0,
            goodAlphas: 0,
            targetGoodAlphas: 10,
            datasetUnits: 0,
            alphasToEnhance: [] as number[],
            alphasEnhanced: [] as number[],
            stage: 'idle' as PipelineStage,
        }

        events.forEach(ev => {
            const data = ev.data
            if (!data) return

            const stage = getStage(data)
            const round = getNumber(data, 'round')
            const goodAlphas = getNumber(data, 'goodAlphasCount')
            const targetGoodAlphas = getNumber(data, 'targetSimulatedGood')
            const datasetUnits = getNumber(data, 'datasetUnitsCount')
            const alphaId = getNumber(data, 'alphaId')

            if (stage === 'pipeline_init') {
                state.enhancerWorkers = getNumber(data, 'enhancerWorkerCount') ?? 0
            } else if (stage === 'planner') {
                state.stage = 'planner'
                state.round = round ?? state.round
                state.goodAlphas = goodAlphas ?? state.goodAlphas
                state.targetGoodAlphas = targetGoodAlphas ?? state.targetGoodAlphas
            } else if (stage === 'generators_dispatch' || stage === 'planner_completed') {
                state.stage = 'generating'
                state.datasetUnits = datasetUnits ?? state.datasetUnits
            } else if (stage === 'generator_completed') {
                state.goodAlphas = goodAlphas ?? state.goodAlphas
                state.targetGoodAlphas = targetGoodAlphas ?? state.targetGoodAlphas
            } else if (stage === 'pipeline_to_enhancer' && alphaId !== undefined) {
                if (!state.alphasToEnhance.includes(alphaId)) {
                    state.alphasToEnhance.push(alphaId)
                }
            } else if (stage === 'enhancer_completed' && alphaId !== undefined) {
                if (!state.alphasEnhanced.includes(alphaId)) {
                    state.alphasEnhanced.push(alphaId)
                }
            } else if (stage === 'round_complete') {
                state.stage = 'round_complete'
                state.goodAlphas = goodAlphas ?? state.goodAlphas
            } else if (stage === 'enhancer_pipeline_complete') {
                state.stage = 'done'
            }
        })

        if (status === 'completed') state.stage = 'done'

        return state
    }, [events, status])

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-muted/5 border-white/5 shadow-none">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium opacity-60">Current Round</span>
                            <PlayCircleIcon className="h-4 w-4 opacity-40" />
                        </div>
                        <div className="mt-2 text-3xl font-black">{pipelineState.round || '-'}</div>
                    </CardContent>
                </Card>
                <Card className="bg-muted/5 border-white/5 shadow-none">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium opacity-60">Good Alphas Found</span>
                            <CheckCircle2Icon className="h-4 w-4 text-green-500/50" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-green-500">{pipelineState.goodAlphas}</span>
                            <span className="text-sm opacity-50">/ {pipelineState.targetGoodAlphas}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-muted/5 border-white/5 shadow-none">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium opacity-60">Alphas Generated</span>
                            <FastForwardIcon className="h-4 w-4 opacity-40" />
                        </div>
                        <div className="mt-2 text-3xl font-black">{pipelineState.alphasToEnhance.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-muted/5 border-white/5 shadow-none bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium opacity-60">Enhanced Alphas</span>
                            <ZapIcon className="h-4 w-4 text-purple-500/50" />
                        </div>
                        <div className="mt-2 text-3xl font-black text-purple-500">{pipelineState.alphasEnhanced.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Pipeline Visualization */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                {/* Connecting Lines */}
                <div className="hidden md:block absolute top-1/2 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-blue-500/20 via-primary/20 to-purple-500/20 -translate-y-1/2 z-0" />

                {/* Stage 1: Planner */}
                <Card className={cn("relative z-10 border-2 transition-all", pipelineState.stage === 'planner' ? "border-blue-500 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]" : "border-white/5")}>
                    <CardHeader className="bg-blue-500/5">
                        <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest">
                            <BrainCircuitIcon className="h-4 w-4 text-blue-500" />
                            Stage 1: Planner
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-6 min-h-[160px] flex flex-col justify-center items-center text-center space-y-4">
                        {pipelineState.stage === 'planner' ? (
                            <>
                                <Loader2Icon className="h-8 w-8 animate-spin text-blue-500" />
                                <div className="text-sm font-medium">Planning Dataset Units...</div>
                            </>
                        ) : pipelineState.stage === 'generating' || pipelineState.stage === 'round_complete' || pipelineState.stage === 'done' ? (
                            <>
                                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <CheckCircle2Icon className="h-6 w-6 text-blue-500" />
                                </div>
                                <div className="text-sm font-medium">Planned {pipelineState.datasetUnits} Units</div>
                            </>
                        ) : (
                            <div className="text-sm opacity-40 italic">Waiting to start...</div>
                        )}
                    </CardContent>
                </Card>

                {/* Stage 2: Generators */}
                <Card className={cn("relative z-10 border-2 transition-all", pipelineState.stage === 'generating' ? "border-primary shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]" : "border-white/5")}>
                    <CardHeader className="bg-primary/5">
                        <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest">
                            <ActivityIcon className="h-4 w-4 text-primary" />
                            Stage 2: Generators
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-6 min-h-[160px] flex flex-col space-y-4">
                        {pipelineState.stage === 'generating' && (
                            <div className="flex items-center gap-2 justify-center mb-2">
                                <Loader2Icon className="h-4 w-4 animate-spin text-primary" />
                                <span className="text-xs font-bold uppercase tracking-wider text-primary">Generating Alphas</span>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            {Array.from({ length: Math.max(pipelineState.datasetUnits, 2) }).map((_, i) => (
                                <div key={i} className={cn(
                                    "h-12 rounded-lg border border-white/10 flex items-center justify-center text-xs font-mono",
                                    i < pipelineState.datasetUnits ? (pipelineState.stage === 'generating' ? "bg-primary/10 text-primary border-primary/20 animate-pulse" : "bg-muted text-muted-foreground") : "opacity-20"
                                )}>
                                    Unit {i + 1}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Stage 3: Enhancers */}
                <Card className={cn("relative z-10 border-2 transition-all", pipelineState.alphasToEnhance.length > pipelineState.alphasEnhanced.length ? "border-purple-500 shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]" : "border-white/5")}>
                    <CardHeader className="bg-purple-500/5">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest">
                                <ZapIcon className="h-4 w-4 text-purple-500" />
                                Stage 3: Enhancers
                            </CardTitle>
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                                {pipelineState.enhancerWorkers} Workers
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-6 min-h-[160px] flex flex-col space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-xs font-medium opacity-60">Queue</span>
                            <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full">
                                {Math.max(0, pipelineState.alphasToEnhance.length - pipelineState.alphasEnhanced.length)}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {pipelineState.alphasToEnhance.slice(-3).map((id, idx) => {
                                const isDone = pipelineState.alphasEnhanced.includes(id)
                                return (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/30 border border-white/5">
                                        <span className="text-xs font-mono opacity-80">Alpha #{id}</span>
                                        {isDone ? (
                                            <CheckCircle2Icon className="h-3 w-3 text-green-500" />
                                        ) : (
                                            <Loader2Icon className="h-3 w-3 text-purple-500 animate-spin" />
                                        )}
                                    </div>
                                )
                            })}
                            {pipelineState.alphasToEnhance.length === 0 && (
                                <div className="text-center text-xs opacity-40 italic py-4">
                                    Waiting for alphas...
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
