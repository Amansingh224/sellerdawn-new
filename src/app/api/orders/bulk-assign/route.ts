import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { OrderStatus, TimelineAction } from "@prisma/client"
import { getShopifyClient } from "@/lib/shopify/client"
import { syncTimelineToShopify } from "@/lib/shopify/sync"

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { orderIds, designerId } = body

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "Order IDs required" },
        { status: 400 }
      )
    }

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

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Process each order
    for (const orderId of orderIds) {
      try {
        const order = await db.order.findUnique({
          where: { id: orderId },
          include: { store: true },
        })

        if (!order) {
          results.failed++
          results.errors.push(`Order ${orderId} not found`)
          continue
        }

        // Update order
        await db.order.update({
          where: { id: orderId },
          data: {
            designerId,
            status: OrderStatus.ASSIGNED,
            tags: {
              push: `Designer: ${designer.name}`,
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
            orderId,
            userId: session.user.id,
            action: TimelineAction.DESIGNER_ASSIGNED,
            description,
            metadata: {
              designerId: designer.id,
              designerName: designer.name,
              bulkAssignment: true,
            },
          },
        })

        // Sync to Shopify notes
        await syncTimelineToShopify(orderId, description, session.user.name || undefined)

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(`Failed to assign order ${orderId}`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Bulk assignment error:", error)
    return NextResponse.json(
      { error: "Failed to bulk assign" },
      { status: 500 }
    )
  }
}
