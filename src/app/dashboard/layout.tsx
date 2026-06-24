"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
    Menu,
    Home,
    LineChart,
    ChevronDown,
    ChevronRight,
    Bot,
    Activity,
    BookOpen,
    FlaskConical,
    Workflow,
    type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { WorkspaceTabsProvider } from "@/components/workspace/workspace-tabs-provider"
import { WorkspaceTabBar } from "@/components/workspace/workspace-tab-bar"
import { WorkspaceHost } from "@/components/workspace/workspace-host"
import { WorkspaceLink } from "@/components/workspace/workspace-link"

type NavItem = {
    title: string
    href?: string
    icon?: LucideIcon
    children?: NavItem[]
}

const NAV_ITEMS: NavItem[] = [
    { title: "Overview", href: "/dashboard", icon: Home },
    {
        title: "Quants",
        icon: LineChart,
        children: [
            {
                title: "WQB",
                children: [
                    { title: "Alpha", href: "/dashboard/wqb/alpha" },
                    { title: "Osmosis", href: "/dashboard/wqb/osmosis" },
                ]
            }
        ]
    },
    {
        title: "Workflow",
        icon: Workflow,
        children: [
            { title: "Workflow Studio", href: "/dashboard/workflow" },
        ]
    },
    {
        title: "Knowledge",
        icon: BookOpen,
        children: [
            { title: "Knowledge Workspace", href: "/dashboard/knowledge" },
        ]
    },
    {
        title: "Research",
        icon: FlaskConical,
        children: [
            { title: "Research Runs", href: "/dashboard/research" },
        ]
    },
    {
        title: "Agent Management",
        icon: Bot,
        children: [
            { title: "Conversation", href: "/dashboard/conversation" },
            { title: "Agents", href: "/dashboard/agent" },
            { title: "LLM Config", href: "/dashboard/agent/llm" },
        ]
    },
    {
        title: "System Management",
        icon: Activity,
        children: [
            { title: "System Task", href: "/dashboard/sys-task" },
        ]
    },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const isItemActive = React.useCallback((item: NavItem): boolean => {
        if (item.href && (pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard"))) {
            return true
        }
        if (item.children) {
            return item.children.some(child => isItemActive(child))
        }
        return false
    }, [pathname])

    const NavItemComponent = ({ item, level = 0 }: { item: NavItem, level?: number }) => {
        const active = isItemActive(item)
        const [expanded, setExpanded] = React.useState(active)
        const Icon = item.icon

        React.useEffect(() => {
            if (active) setExpanded(true)
        }, [active])

        if (item.children) {
            return (
                <div className="space-y-1">
                    <Button
                        variant="ghost"
                        className={cn("w-full justify-between pr-4 h-9", active ? "font-semibold text-primary bg-muted/50" : "text-muted-foreground")}
                        style={{ paddingLeft: `${(level) * 16 + 16}px` }}
                        onClick={() => setExpanded(!expanded)}
                    >
                        <div className="flex items-center">
                            {Icon && <Icon className="mr-2 h-4 w-4" />}
                            {item.title}
                        </div>
                        {expanded ? <ChevronDown className="h-4 w-4 opacity-50" /> : <ChevronRight className="h-4 w-4 opacity-50" />}
                    </Button>
                    {expanded && (
                        <div className="space-y-1 pb-1">
                            {item.children.map((child, idx) => (
                                <NavItemComponent key={idx} item={child} level={level + 1} />
                            ))}
                        </div>
                    )}
                </div>
            )
        }

        const isCurrentPage = item.href && pathname === item.href

        return (
            <Button
                variant={isCurrentPage ? "secondary" : "ghost"}
                className={cn(
                    "w-full justify-start h-9 text-sm",
                    isCurrentPage ? "font-medium" : "text-muted-foreground",
                )}
                style={{ paddingLeft: `${(level) * 16 + 16}px` }}
                asChild
                onClick={() => setIsMobileMenuOpen(false)}
            >
                <WorkspaceLink href={item.href || "#"}>
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    {item.title}
                </WorkspaceLink>
            </Button>
        )
    }

    const NavContent = () => (
        <ScrollArea className="flex flex-col gap-2 h-full py-4">
            <div className="flex items-center gap-2 mb-8 px-6">
                <Home className="h-6 w-6 text-primary" />
                <span className="font-bold tracking-tight text-lg">workspace</span>
            </div>
            <nav className="space-y-1 px-3">
                {NAV_ITEMS.map((item, idx) => (
                    <NavItemComponent key={idx} item={item} />
                ))}
            </nav>
        </ScrollArea>
    )

    return (
        <WorkspaceTabsProvider>
            <div className="flex h-screen overflow-hidden bg-background text-foreground">
                {/* Desktop Sidebar */}
                <aside className="hidden border-r bg-muted/20 md:block md:w-64 lg:w-72 fixed inset-y-0 left-0 z-50">
                    <NavContent />
                </aside>

                <div className="flex min-h-0 w-full flex-col md:pl-64 lg:pl-72">
                    {/* Mobile Header */}
                    <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 md:px-6 flex-shrink-0 sticky top-0 z-40 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
                        {mounted ? (
                            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">Toggle navigation menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[300px] p-0">
                                    <SheetHeader className="p-4 border-b text-left">
                                        <SheetTitle>Navigation</SheetTitle>
                                    </SheetHeader>
                                    <NavContent />
                                </SheetContent>
                            </Sheet>
                        ) : (
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                                type="button"
                                aria-label="Toggle navigation menu"
                                disabled
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        )}

                        <div className="w-full flex-1 flex justify-end">
                            <ThemeToggle />
                        </div>
                    </header>

                    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                        <WorkspaceTabBar />
                        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto animate-in fade-in duration-500">
                            <WorkspaceHost>{children}</WorkspaceHost>
                        </main>
                    </div>
                </div>
            </div>
        </WorkspaceTabsProvider>
    )
}
