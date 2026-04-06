"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type PageShellProps = {
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

// PageShell owns only page-level spacing and rhythm.
// It should stay context-agnostic and never encode module-specific structure.
export function PageShell({
  children,
  className,
  contentClassName,
}: PageShellProps) {
  return (
    <div className={cn("p-6", className)}>
      <div className={cn("space-y-6", contentClassName)}>{children}</div>
    </div>
  )
}
