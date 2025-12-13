"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Package } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

interface Order {
  id: string
  name: string
  customerFirstName: string | null
  customerLastName: string | null
  customerEmail: string | null
  status: string
  createdAt: string
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
  IMPORTED: "secondary",
  ASSIGNED: "info",
  DRAFT_SENT: "warning",
  DRAFT_APPROVED: "success",
  DRAFT_REJECTED: "destructive",
  PENDING_PRINT: "warning",
  PRINTED: "info",
  FULFILLED: "success",
}

const statusLabels: Record<string, string> = {
  IMPORTED: "Imported",
  ASSIGNED: "Assigned",
  DRAFT_SENT: "Draft Sent",
  DRAFT_APPROVED: "Approved",
  DRAFT_REJECTED: "Rejected",
  PENDING_PRINT: "Pending Print",
  PRINTED: "Printed",
  FULFILLED: "Fulfilled",
}

export function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch("/api/orders?limit=5")
        const data = await response.json()
        setOrders(data.orders || [])
      } catch (error) {
        console.error("Failed to fetch orders:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const getCustomerName = (order: Order) => {
    if (order.customerFirstName || order.customerLastName) {
      return `${order.customerFirstName || ""} ${order.customerLastName || ""}`.trim()
    }
    return order.customerEmail || "Unknown"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/orders" className="gap-1">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-6 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No orders yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Connect your Shopify store to import orders
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{order.name}</p>
                  <p className="text-xs text-muted-foreground">{getCustomerName(order)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusColors[order.status] || "secondary"}>
                    {statusLabels[order.status] || order.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(order.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
