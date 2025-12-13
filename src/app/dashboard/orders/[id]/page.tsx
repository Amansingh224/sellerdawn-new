import { getSession } from "@/lib/get-session"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { OrderDetail } from "@/components/orders/order-detail"

interface OrderPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderPage({ params }: OrderPageProps) {
  const session = await getSession()
  const { id } = await params

  if (!session?.user) {
    redirect("/login")
  }

  const order = await db.order.findUnique({
    where: { id },
    include: {
      lineItems: true,
      customerImages: true,
      store: {
        select: { id: true, name: true, domain: true },
      },
      designer: {
        select: { id: true, name: true, email: true },
      },
      drafts: {
        include: {
          designer: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      timelineEvents: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!order) {
    notFound()
  }

  // If user is a designer, ensure they can only view their assigned orders
  if (session.user.role === "DESIGNER" && order.designerId !== session.user.id) {
    redirect("/dashboard/orders")
  }

  return (
    <OrderDetail
      order={order}
      userRole={session.user.role}
      userId={session.user.id}
    />
  )
}
