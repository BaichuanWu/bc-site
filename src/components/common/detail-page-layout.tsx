"use client"

import * as React from "react"

import { PageShell } from "@/components/common/page-shell"
import { cn } from "@/lib/utils"

type DetailPageLayoutProps = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  badge?: React.ReactNode
  actions?: React.ReactNode
  side?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function DetailPageLayout({
  title,
  subtitle,
  badge,
  actions,
  side,
  children,
  className,
}: DetailPageLayoutProps) {
  return (
    <PageShell className={className}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{title}</h1>
            {badge}
          </div>
          {subtitle ? (
            <div className="max-w-4xl text-sm text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>

      <div className={cn("grid gap-6", side ? "xl:grid-cols-[minmax(0,1fr)_320px]" : "")}>
        <div className="min-w-0 space-y-6">{children}</div>
        {side ? <aside className="space-y-4">{side}</aside> : null}
      </div>
    </PageShell>
  )
}
