"use client"

import type * as React from "react"

import { DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

function preventCloseWhileMarkdownFullscreen(event: Event) {
    if (typeof document === "undefined") return
    if (document.documentElement.dataset.mdEditorFullscreen === "true") {
        event.preventDefault()
    }
}

export function MarkdownDialogContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof DialogContent>) {
    return (
        <DialogContent
            className={cn("sm:max-w-[1100px] max-h-[90vh] flex flex-col p-0", className)}
            onInteractOutside={preventCloseWhileMarkdownFullscreen}
            onPointerDownOutside={preventCloseWhileMarkdownFullscreen}
            onEscapeKeyDown={preventCloseWhileMarkdownFullscreen}
            {...props}
        >
            {children}
        </DialogContent>
    )
}
