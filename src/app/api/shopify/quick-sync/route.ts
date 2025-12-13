import { NextResponse } from "next/server"
import { syncShopifyOrders } from "@/lib/shopify/sync"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")

  if (key !== "sellerdawn2024sync") {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 })
  }

  try {
    const result = await syncShopifyOrders()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json(
      { error: "Sync failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    )
  }
}
