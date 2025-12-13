import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { syncShopifyOrders } from "@/lib/shopify/sync"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")

  if (key !== "sellerdawn2024sync") {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 })
  }

  try {
    // Find the real store (not the demo store)
    const realStore = await db.shopifyStore.findFirst({
      where: {
        isActive: true,
        domain: {
          not: "demo-store.myshopify.com"
        }
      }
    })

    if (!realStore) {
      return NextResponse.json({
        success: false,
        error: "No real Shopify store found. Connect your store first."
      }, { status: 400 })
    }

    // Pass the specific store ID to sync
    const result = await syncShopifyOrders(realStore.id)

    return NextResponse.json({
      ...result,
      store: {
        id: realStore.id,
        domain: realStore.domain,
        name: realStore.name
      }
    })
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json(
      { error: "Sync failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    )
  }
}
