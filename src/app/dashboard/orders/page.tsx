import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { OrdersTable } from "@/components/orders/orders-table"
import { OrderFilters } from "@/components/orders/order-filters"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import Link from "next/link"

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string
    designer?: string
    search?: string
    page?: string
  }>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const session = await auth()
  const params = await searchParams

  if (!session?.user) {
    redirect("/login")
  }

  const page = Number(params.page) || 1
  const pageSize = 20

  // Build where clause based on filters
  const where: Record<string, unknown> = {}

  if (params.status) {
    where.internalStatus = params.status
  }

  if (params.designer) {
    where.designerId = params.designer
  }

  if (params.search) {
    where.OR = [
      { shopifyOrderNumber: { contains: params.search, mode: "insensitive" } },
      { customerName: { contains: params.search, mode: "insensitive" } },
      { customerEmail: { contains: params.search, mode: "insensitive" } },
    ]
  }

  // If user is a designer, only show their assigned orders
  if (session.user.role === "DESIGNER") {
    where.designerId = session.user.id
  }

  const [orders, total, designers] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        lineItems: true,
        designer: {
          select: { id: true, name: true },
        },
        _count: {
          select: { drafts: true },
        },
      },
      orderBy: { shopifyCreatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.order.count({ where }),
    db.user.findMany({
      where: { role: "DESIGNER", isActive: true },
      select: { id: true, name: true },
    }),
  ])

  const totalPages = Math.ceil(total / pageSize)

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

      <OrderFilters designers={designers} />

      <OrdersTable
        orders={orders}
        currentPage={page}
        totalPages={totalPages}
        total={total}
      />
    </div>
  )
}
