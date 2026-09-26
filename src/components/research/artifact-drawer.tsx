"use client"

import * as React from "react"
import useSWR from "swr"
import { ChevronRightIcon, FlaskConicalIcon } from "lucide-react"

import { ResearchJsonPanel } from "@/components/research/json-panel"
import { ResearchStatusBadge } from "@/components/research/status-badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ResearchExperiment } from "@/components/research/types"
import { apiClient } from "@/lib/api"

export function ResearchArtifactDrawer({
  experiment,
}: {
  experiment: ResearchExperiment
}) {
  const [open, setOpen] = React.useState(false)
  const { data: detail } = useSWR<ResearchExperiment>(
    open ? `/research/experiments/${experiment.id}` : null,
    async (url: string) => (await apiClient.get(url)) as ResearchExperiment,
  )
  const displayExperiment = detail || experiment

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          Details
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col overflow-hidden p-0 sm:max-w-[80vw]">
        <SheetHeader className="border-b bg-muted/20 p-6 text-left">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FlaskConicalIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="truncate">{displayExperiment.displayName}</SheetTitle>
                <ResearchStatusBadge
                  status={displayExperiment.status}
                  statusName={displayExperiment.statusName}
                />
              </div>
              <SheetDescription className="font-mono text-xs">
                #{displayExperiment.id} • {displayExperiment.ref}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="io" className="space-y-4">
            <TabsList>
              <TabsTrigger value="io">Input / Output</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="mutation">Mutation</TabsTrigger>
              <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
              <TabsTrigger value="trace">Trace</TabsTrigger>
            </TabsList>
            <TabsContent value="io" className="grid gap-4 lg:grid-cols-2">
              <ResearchJsonPanel title="Input" data={displayExperiment.input} />
              <ResearchJsonPanel title="Output" data={displayExperiment.output} />
            </TabsContent>
            <TabsContent value="feedback" className="space-y-4">
              <ResearchJsonPanel title="Feedback" data={displayExperiment.feedback} />
              <ResearchJsonPanel title="Attribution" data={displayExperiment.attribution} />
            </TabsContent>
            <TabsContent value="mutation" className="space-y-4">
              <ResearchJsonPanel title="Mutation" data={displayExperiment.mutation} />
            </TabsContent>
            <TabsContent value="artifacts" className="space-y-4">
              <ResearchJsonPanel title="Artifacts" data={displayExperiment.artifacts} />
            </TabsContent>
            <TabsContent value="trace" className="space-y-4">
              <ResearchJsonPanel title="Trace" data={displayExperiment.trace || []} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
