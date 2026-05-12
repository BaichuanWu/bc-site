"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const STATUS_TONE: Record<number, string> = {
  0: "bg-muted text-muted-foreground border-border",
  10: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  20: "bg-green-500/10 text-green-500 border-green-500/20",
  30: "bg-red-500/10 text-red-500 border-red-500/20",
  40: "bg-slate-500/10 text-slate-500 border-slate-500/20",
}

export function ResearchStatusBadge({
  status,
  statusName,
  className,
}: {
  status: number
  statusName?: string
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap text-[10px] font-bold uppercase tracking-wider",
        STATUS_TONE[status] || STATUS_TONE[0],
        className,
      )}
    >
      {statusName || status}
    </Badge>
  )
}
