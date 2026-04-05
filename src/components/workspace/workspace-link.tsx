"use client"

import Link, { type LinkProps } from "next/link"
import * as React from "react"

import { isDashboardPath } from "@/lib/workspace-tabs"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"

type WorkspaceLinkProps = LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    titleOverride?: string
    closable?: boolean
  }

export function WorkspaceLink({
  href,
  onClick,
  titleOverride,
  closable,
  ...props
}: WorkspaceLinkProps) {
  const navigate = useWorkspaceNavigate()
  const hrefString = typeof href === "string" ? href : href.pathname || ""

  return (
    <Link
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event)
        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return
        }
        const [pathname, search = ""] = hrefString.split("?")
        if (!isDashboardPath(pathname)) return
        event.preventDefault()
        navigate(pathname, search, {
          title: titleOverride,
          closable,
        })
      }}
    />
  )
}
