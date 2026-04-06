"use client"

import * as React from "react"
import { MoreHorizontal, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageShell } from "@/components/common/page-shell"

type ListPageShellProps = {
  title: string
  icon: LucideIcon
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

// ListPageShell defines the shared list-page frame only.
// Fetching, filters, and resource-specific actions belong to composition layers above it.
export function ListPageActions({ actions }: { actions?: React.ReactNode }) {
  const actionNodes = React.Children.toArray(actions).filter(Boolean)

  if (actionNodes.length === 0) return null

  if (actionNodes.length <= 2) {
    return <div className="flex items-center gap-2">{actionNodes}</div>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          Actions
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1.5">
        <div className="flex flex-col gap-1">{actionNodes}</div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ListPageShell({
  title,
  icon: Icon,
  actions,
  children,
  className,
}: ListPageShellProps) {
  return (
    <PageShell className={className} contentClassName="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted/40">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
        </div>
        <ListPageActions actions={actions} />
      </div>
      {children}
    </PageShell>
  )
}
