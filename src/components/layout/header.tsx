"use client"

import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import {
  Bell,
  Search,
  LogOut,
  User,
  Settings,
  RefreshCw,
} from "lucide-react"
import { Input } from "@/components/ui/input"

interface HeaderProps {
  user: {
    name?: string | null
    email?: string | null
    role: string
  }
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/orders": "Orders",
  "/dashboard/designers": "Designers",
  "/dashboard/print-queue": "Print Queue",
  "/dashboard/print-groups": "Print Groups",
  "/dashboard/rejections": "Draft Rejections",
  "/dashboard/fulfillment": "Fulfillment",
  "/dashboard/reports": "Reports",
  "/dashboard/settings": "Settings",
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname()

  const getPageTitle = () => {
    // Check exact match first
    if (pageTitles[pathname]) return pageTitles[pathname]

    // Check for nested routes
    for (const [path, title] of Object.entries(pageTitles)) {
      if (pathname.startsWith(path) && path !== "/dashboard") {
        return title
      }
    }

    return "Dashboard"
  }

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="w-64 pl-9 h-9"
          />
        </div>

        {/* Sync Button (Admin only) */}
        {user.role === "ADMIN" && (
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Sync</span>
          </Button>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            {user.role === "ADMIN" && (
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
