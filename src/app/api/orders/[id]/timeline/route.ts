import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { TimelineAction } from "@prisma/client"
import { syncTimelineToShopify } from "@/lib/shopify/sync"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const events = await db.timelineEvent.findMany({
      where: { orderId: params.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Timeline fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch timeline" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, description, metadata } = body

    if (!description) {
      return NextResponse.json(
        { error: "Description required" },
        { status: 400 }
      )
    }

    // Verify order exists
    const order = await db.order.findUnique({
      where: { id: params.id },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Create timeline entry
    const event = await db.timelineEvent.create({
      data: {
        orderId: params.id,
        userId: session.user.id,
        action: action || TimelineAction.NOTE_ADDED,
        description,
        metadata,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Sync to Shopify
    await syncTimelineToShopify(params.id, description, session.user.name || undefined)

    // Update the timeline event to mark as synced
    await db.timelineEvent.update({
      where: { id: event.id },
      data: {
        syncedToShopify: true,
        shopifySyncedAt: new Date(),
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("Timeline create error:", error)
    return NextResponse.json(
      { error: "Failed to create timeline entry" },
      { status: 500 }
    )
  }
}
