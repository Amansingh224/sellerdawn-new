import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Package } from "lucide-react"

// Placeholder data - will be replaced with real data
const recentOrders: {
  id: string
  orderNumber: string
  customer: string
  status: string
  createdAt: string
}[] = []

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
        {recentOrders.length === 0 ? (
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
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">#{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{order.customer}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusColors[order.status] || "secondary"}>
                    {statusLabels[order.status] || order.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {order.createdAt}
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
