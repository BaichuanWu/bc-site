"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { JsonNode } from "@/components/common/json-node"

export function ResearchJsonPanel({
  title,
  data,
}: {
  title: string
  data: unknown
}) {
  return (
    <Card className="overflow-hidden shadow-none">
      <CardHeader className="border-b bg-muted/20 py-3">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <JsonNode data={data ?? {}} depth={0} />
      </CardContent>
    </Card>
  )
}
