import { NextResponse } from "next/server"
import { getApiSession } from "@/lib/api-session"
import { db } from "@/lib/db"
import { OrderStatus } from "@prisma/client"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getApiSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status") as OrderStatus | null
    const search = searchParams.get("search")
    const designerId = searchParams.get("designerId")

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // Role-based filtering
    if (session.user.role === "DESIGNER") {
      where.designerId = session.user.id
    }

    if (status) {
      where.status = status
    }

    if (designerId) {
      where.designerId = designerId
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { customerFirstName: { contains: search, mode: "insensitive" } },
        { customerLastName: { contains: search, mode: "insensitive" } },
      ]
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
          _count: {
            select: {
              drafts: true,
              timelineEvents: true,
            },
          },
        },
      }),
      db.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Orders fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}
