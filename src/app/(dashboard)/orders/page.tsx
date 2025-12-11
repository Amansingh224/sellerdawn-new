import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { OrdersTable } from "@/components/orders/orders-table"
import { OrdersHeader } from "@/components/orders/orders-header"
import { Skeleton } from "@/components/ui/skeleton"

export default async function OrdersPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <OrdersHeader userRole={session.user.role} />

      <Suspense fallback={<OrdersTableSkeleton />}>
        <OrdersTable userRole={session.user.role} userId={session.user.id} />
      </Suspense>
    </div>
  )
}

function OrdersTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="border rounded-lg">
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
