"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  LayoutDashboard,
  Package,
  Users,
  Printer,
  FileImage,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
  ClipboardList,
  Truck,
  BarChart3,
} from "lucide-react"

interface SidebarProps {
  user: {
    name?: string | null
    role: string
  }
}

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    href: "/dashboard/orders",
    icon: Package,
  },
  {
    title: "Designers",
    href: "/dashboard/designers",
    icon: Users,
  },
  {
    title: "Print Queue",
    href: "/dashboard/print-queue",
    icon: Printer,
  },
  {
    title: "Draft Rejections",
    href: "/dashboard/rejections",
    icon: FileImage,
  },
  {
    title: "Fulfillment",
    href: "/dashboard/fulfillment",
    icon: Truck,
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
]

const designerNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Orders",
    href: "/dashboard/orders",
    icon: Package,
  },
  {
    title: "Draft Rejections",
    href: "/dashboard/rejections",
    icon: FileImage,
  },
]

const printerNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Print Queue",
    href: "/dashboard/print-queue",
    icon: Printer,
  },
  {
    title: "Print Groups",
    href: "/dashboard/print-groups",
    icon: ClipboardList,
  },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Get nav items based on role
  const getNavItems = () => {
    switch (user.role) {
      case "ADMIN":
        return adminNavItems
      case "DESIGNER":
        return designerNavItems
      case "PRINTER":
        return printerNavItems
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <div
      className={cn(
        "relative flex flex-col h-screen bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-accent">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-white">Seller Dawn</span>
          )}
        </Link>
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border bg-background text-foreground shadow-md hover:bg-accent"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href))

            if (collapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-center h-10 w-10 rounded-lg transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-white"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 h-10 px-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.title}</span>
              </Link>
            )
          })}
        </nav>

        {user.role === "ADMIN" && (
          <>
            <Separator className="my-4 bg-sidebar-accent" />
            <nav className="space-y-1">
              {collapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href="/dashboard/settings"
                      className={cn(
                        "flex items-center justify-center h-10 w-10 rounded-lg transition-colors",
                        pathname.startsWith("/dashboard/settings")
                          ? "bg-sidebar-accent text-white"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                      )}
                    >
                      <Settings className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">Settings</TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  href="/dashboard/settings"
                  className={cn(
                    "flex items-center gap-3 h-10 px-3 rounded-lg transition-colors",
                    pathname.startsWith("/dashboard/settings")
                      ? "bg-sidebar-accent text-white"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                  )}
                >
                  <Settings className="h-5 w-5 shrink-0" />
                  <span>Settings</span>
                </Link>
              )}
            </nav>
          </>
        )}
      </ScrollArea>

      {/* User Info */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-accent">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sidebar-accent text-white font-medium text-sm">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">
                {user.role.toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
