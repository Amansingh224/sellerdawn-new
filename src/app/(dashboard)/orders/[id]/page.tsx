import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { OrderDetail } from "@/components/orders/order-detail"

export const dynamic = 'force-dynamic'

interface OrderPageProps {
  params: {
    id: string
  }
}

export default async function OrderPage({ params }: OrderPageProps) {
  const session = await auth()

  if (!session?.user) {
    notFound()
  }

  const order = await db.order.findUnique({
    where: { id: params.id },
    include: {
      designer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      lineItems: true,
      customerImages: true,
      drafts: {
        orderBy: { version: "desc" },
        include: {
          designer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      timelineEvents: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      printGroup: true,
      store: {
        select: {
          id: true,
          name: true,
          domain: true,
        },
      },
    },
  })

  if (!order) {
    notFound()
  }

  // Check access for designers
  if (
    session.user.role === "DESIGNER" &&
    order.designerId !== session.user.id
  ) {
    notFound()
  }

  return <OrderDetail order={order} userRole={session.user.role} userId={session.user.id} />
}
