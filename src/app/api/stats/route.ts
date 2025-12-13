import { NextResponse } from "next/server"
import { getApiSession } from "@/lib/api-session"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getApiSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = session.user.role
    const userId = session.user.id

    if (role === "ADMIN") {
      const [total, imported, draftSent, approved] = await Promise.all([
        db.order.count(),
        db.order.count({ where: { status: "IMPORTED" } }),
        db.order.count({ where: { status: "DRAFT_SENT" } }),
        db.order.count({ where: { status: "DRAFT_APPROVED" } }),
      ])

      return NextResponse.json({
        stats: [
          { key: "total", value: total },
          { key: "imported", value: imported },
          { key: "draftSent", value: draftSent },
          { key: "approved", value: approved },
        ]
      })
    }

    if (role === "DESIGNER") {
      const [assigned, draftSent, rejected, completedToday] = await Promise.all([
        db.order.count({ where: { designerId: userId, status: "ASSIGNED" } }),
        db.order.count({ where: { designerId: userId, status: "DRAFT_SENT" } }),
        db.order.count({ where: { designerId: userId, status: "DRAFT_REJECTED" } }),
        db.order.count({
          where: {
            designerId: userId,
            status: "DRAFT_APPROVED",
            updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        }),
      ])

      return NextResponse.json({
        stats: [
          { key: "assigned", value: assigned },
          { key: "draftSent", value: draftSent },
          { key: "rejected", value: rejected },
          { key: "completedToday", value: completedToday },
        ]
      })
    }

    if (role === "PRINTER") {
      const [printQueue, printed, fulfilled] = await Promise.all([
        db.order.count({ where: { status: "PENDING_PRINT" } }),
        db.order.count({ where: { status: "PRINTED" } }),
        db.order.count({ where: { status: "FULFILLED" } }),
      ])

      return NextResponse.json({
        stats: [
          { key: "printQueue", value: printQueue },
          { key: "printed", value: printed },
          { key: "fulfilled", value: fulfilled },
          { key: "completedToday", value: 0 },
        ]
      })
    }

    return NextResponse.json({ stats: [] })
  } catch (error) {
    console.error("Stats fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
