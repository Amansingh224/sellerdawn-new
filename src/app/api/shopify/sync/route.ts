import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { syncShopifyOrders } from "@/lib/shopify/sync"

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const storeId = body.storeId as string | undefined

    const result = await syncShopifyOrders(storeId)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json(
      { error: "Sync failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// For cron jobs / external triggers
export async function GET(request: Request) {
  try {
    // Verify cron secret for automated syncs
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const result = await syncShopifyOrders()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    )
  }
}
