"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Download, UserPlus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface OrdersHeaderProps {
  userRole: string
}

export function OrdersHeader({ userRole }: OrdersHeaderProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const { toast } = useToast()

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch("/api/shopify/sync", {
        method: "POST",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sync Complete",
          description: `Imported: ${result.imported}, Updated: ${result.updated}`,
        })
        // Refresh the page to show new orders
        window.location.reload()
      } else {
        toast({
          title: "Sync Failed",
          description: result.errors?.join(", ") || "Unknown error",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "Failed to sync orders from Shopify",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          {userRole === "DESIGNER"
            ? "View and manage your assigned orders"
            : "Manage all orders and assign designers"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {userRole === "ADMIN" && (
          <>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
              />
              {isSyncing ? "Syncing..." : "Sync Shopify"}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
