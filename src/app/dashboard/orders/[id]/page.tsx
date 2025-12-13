import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { OrderDetail } from "@/components/orders/order-detail"

interface OrderPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderPage({ params }: OrderPageProps) {
  const session = await auth()
  const { id } = await params

  if (!session?.user) {
    redirect("/login")
  }

  const order = await db.order.findUnique({
    where: { id },
    include: {
      lineItems: {
        include: {
          customerImages: true,
        },
      },
      designer: {
        select: { id: true, name: true, email: true },
      },
      drafts: {
        include: {
          uploadedBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      timeline: {
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

  // Get list of designers for assignment dropdown
  const designers = await db.user.findMany({
    where: { role: "DESIGNER", isActive: true },
    select: { id: true, name: true },
  })

  return (
    <OrderDetail
      order={order}
      designers={designers}
      currentUser={session.user}
    />
  )
}
