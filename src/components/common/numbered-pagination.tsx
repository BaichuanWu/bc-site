"use client"

import { Button } from "@/components/ui/button"

type Props = {
  page: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function NumberedPagination({ page, total, pageSize, onPageChange }: Props) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pageCount - 1)
  const nearStart = Math.max(0, current - 2)
  const nearEnd = Math.min(pageCount - 1, current + 2)
  const pages = Array.from(new Set([0, pageCount - 1, ...Array.from(
    { length: nearEnd - nearStart + 1 }, (_, index) => nearStart + index,
  )])).sort((a, b) => a - b)

  return <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm">
    <span className="text-muted-foreground">{total.toLocaleString()} records · page {current + 1} of {pageCount}</span>
    <div className="flex flex-wrap items-center gap-1">
      {pages.map((target, index) => <span key={target} className="flex items-center gap-1">
        {index > 0 && target - pages[index - 1] > 1 ? <span aria-hidden="true" className="px-1 text-muted-foreground">…</span> : null}
        <Button type="button" size="sm" variant={target === current ? "default" : "outline"}
          aria-label={`Go to page ${target + 1}`} aria-current={target === current ? "page" : undefined}
          onClick={() => onPageChange(target)}>{target + 1}</Button>
      </span>)}
    </div>
  </nav>
}
