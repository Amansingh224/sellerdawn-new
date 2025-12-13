import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { syncShopifyOrders } from "@/lib/shopify/sync"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  // Allow if CRON_SECRET matches or if no secret is set (for development)
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("Cron sync started at:", new Date().toISOString())

    // Find real stores (exclude demo)
    const stores = await db.shopifyStore.findMany({
      where: {
        isActive: true,
        domain: {
          not: "demo-store.myshopify.com"
        }
      }
    })

    const results = []
    for (const store of stores) {
      const result = await syncShopifyOrders(store.id)
      results.push({
        store: store.domain,
        ...result
      })
    }

    console.log("Cron sync completed:", results)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      storesSynced: stores.length,
      results,
    })
  } catch (error) {
    console.error("Cron sync error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}
