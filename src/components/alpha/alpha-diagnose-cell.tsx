"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

type DiagnosticIssue = {
    key: string
    state: "REJECT" | "BLOCKED" | "PENDING"
    details: string
}

export type AlphaDiagnostics = {
    RA: DiagnosticIssue[]
    PPA: DiagnosticIssue[]
}

type AlphaDiagnoseCellProps = {
    alphaId: string | number
    wqbAlphaId?: string | null
    diagnostics?: AlphaDiagnostics
}

export function AlphaDiagnoseCell({
    alphaId,
    wqbAlphaId,
    diagnostics,
}: AlphaDiagnoseCellProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto gap-2 px-1 py-1 font-mono" aria-label={`Open diagnosis for Alpha ${wqbAlphaId || alphaId}`}>
                    {diagnostics ? (
                        <>
                            <Badge variant="outline">RA {diagnostics.RA.length}</Badge>
                            <Badge variant="outline">PPA {diagnostics.PPA.length}</Badge>
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground">Diagnosis unavailable</span>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Diagnose · {wqbAlphaId || `#${alphaId}`}</DialogTitle>
                    <DialogDescription>
                        RA Count and PPA Count cover platform checks only. Diagnose counts all listed issues, including simulation, margin, and correlation conditions.
                    </DialogDescription>
                </DialogHeader>
                {diagnostics ? (
                    <div className="space-y-5">
                        {(["RA", "PPA"] as const).map((target) => (
                            <section key={target} className="space-y-2" aria-label={`${target} diagnosis`}>
                                <h3 className="font-semibold">{target}</h3>
                                {diagnostics[target].length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No issues</p>
                                ) : (
                                    <div className="space-y-2">
                                        {diagnostics[target].map((issue, index) => (
                                            <div key={`${issue.key}-${index}`} className="rounded-md border p-3">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <span className="font-mono text-sm font-semibold break-all">{issue.key}</span>
                                                    <Badge variant={issue.state === "PENDING" ? "secondary" : "destructive"}>{issue.state}</Badge>
                                                </div>
                                                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{issue.details}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Diagnosis unavailable</p>
                )}
            </DialogContent>
        </Dialog>
    )
}
