import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { OrderStatus, TimelineAction } from "@prisma/client"
import { getShopifyClient } from "@/lib/shopify/client"
import { syncTimelineToShopify } from "@/lib/shopify/sync"

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { designerId } = body

    if (!designerId) {
      return NextResponse.json(
        { error: "Designer ID required" },
        { status: 400 }
      )
    }

    // Get designer
    const designer = await db.user.findUnique({
      where: { id: designerId },
    })

    if (!designer) {
      return NextResponse.json(
        { error: "Designer not found" },
        { status: 404 }
      )
    }

    // Get order
    const order = await db.order.findUnique({
      where: { id: params.id },
      include: { store: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Update order
    const updatedOrder = await db.order.update({
      where: { id: params.id },
      data: {
        designerId,
        status: OrderStatus.ASSIGNED,
        tags: {
          push: `Designer: ${designer.name}`,
        },
      },
      include: {
        designer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Update Shopify tags
    try {
      const client = await getShopifyClient(order.storeId)
      if (client) {
        const currentTags = order.tags.filter(
          (tag) => !tag.startsWith("Designer:")
        )
        currentTags.push(`Designer: ${designer.name}`)
        await client.updateOrderTags(order.shopifyId, currentTags)
      }
    } catch (shopifyError) {
      console.error("Failed to update Shopify tags:", shopifyError)
    }

    // Create timeline entry
    const description = `Designer ${designer.name} assigned to order`
    await db.timelineEvent.create({
      data: {
        orderId: params.id,
        userId: session.user.id,
        action: TimelineAction.DESIGNER_ASSIGNED,
        description,
        metadata: {
          designerId: designer.id,
          designerName: designer.name,
        },
      },
    })

    // Sync to Shopify notes
    await syncTimelineToShopify(params.id, description, session.user.name || undefined)

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Assignment error:", error)
    return NextResponse.json(
      { error: "Failed to assign designer" },
      { status: 500 }
    )
  }
}
