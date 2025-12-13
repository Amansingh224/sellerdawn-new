import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { OrdersTable } from "@/components/orders/orders-table"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import Link from "next/link"

function OrdersTableFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="mt-2 text-sm text-muted-foreground">Loading orders...</p>
      </div>
    </div>
  )
}

export default async function OrdersPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage and track all orders
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/api/shopify/sync">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Orders
          </Link>
        </Button>
      </div>

      <Suspense fallback={<OrdersTableFallback />}>
        <OrdersTable
          userRole={session.user.role}
          userId={session.user.id}
        />
      </Suspense>
    </div>
  )
}
