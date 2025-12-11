import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Check access for designers
    if (
      session.user.role === "DESIGNER" &&
      order.designerId !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Order fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, designerId, note, trackingNumber, trackingCarrier } = body

    const order = await db.order.findUnique({
      where: { id: params.id },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}

    if (status) {
      updateData.status = status
    }

    if (designerId !== undefined) {
      updateData.designerId = designerId
    }

    if (note !== undefined) {
      updateData.note = note
    }

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber
    }

    if (trackingCarrier) {
      updateData.trackingCarrier = trackingCarrier
    }

    const updatedOrder = await db.order.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Order update error:", error)
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    )
  }
}
