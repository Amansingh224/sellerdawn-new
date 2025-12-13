import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { syncShopifyOrders } from "@/lib/shopify/sync"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")
  const token = searchParams.get("token")

  if (key !== "sellerdawn2024reset") {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 })
  }

  const results: string[] = []

  try {
    // Step 1: Delete all timeline events first (foreign key constraint)
    const deletedTimeline = await db.timelineEvent.deleteMany({})
    results.push(`Deleted ${deletedTimeline.count} timeline events`)

    // Step 2: Delete all drafts
    const deletedDrafts = await db.draft.deleteMany({})
    results.push(`Deleted ${deletedDrafts.count} drafts`)

    // Step 3: Delete all customer images
    const deletedImages = await db.customerImage.deleteMany({})
    results.push(`Deleted ${deletedImages.count} customer images`)

    // Step 4: Delete all line items
    const deletedLineItems = await db.lineItem.deleteMany({})
    results.push(`Deleted ${deletedLineItems.count} line items`)

    // Step 5: Delete all orders
    const deletedOrders = await db.order.deleteMany({})
    results.push(`Deleted ${deletedOrders.count} orders`)

    // Step 6: Delete the demo store
    const deletedDemo = await db.shopifyStore.deleteMany({
      where: { domain: "demo-store.myshopify.com" }
    })
    results.push(`Deleted ${deletedDemo.count} demo store(s)`)

    // Step 7: Update pet-on-canvas store with new token if provided
    if (token) {
      const updatedStore = await db.shopifyStore.updateMany({
        where: { domain: "pet-on-canvas.myshopify.com" },
        data: {
          accessToken: token,
          isActive: true
        }
      })
      results.push(`Updated ${updatedStore.count} store(s) with new token`)
    }

    // Step 8: Get the store and sync
    const store = await db.shopifyStore.findFirst({
      where: {
        isActive: true,
        domain: { not: "demo-store.myshopify.com" }
      }
    })

    if (!store) {
      return NextResponse.json({
        success: false,
        results,
        error: "No store found after cleanup. Please reconnect."
      })
    }

    // Step 9: Test connection before syncing
    const testUrl = `https://${store.domain}/admin/api/2024-01/shop.json`
    const testResponse = await fetch(testUrl, {
      headers: {
        "X-Shopify-Access-Token": store.accessToken,
        "Content-Type": "application/json",
      },
    })

    if (!testResponse.ok) {
      const error = await testResponse.text()
      return NextResponse.json({
        success: false,
        results,
        error: `Token test failed: ${error}`,
        hint: "Add &token=YOUR_NEW_TOKEN to update the token"
      })
    }

    results.push("Token verified successfully")

    // Step 10: Sync orders
    const syncResult = await syncShopifyOrders(store.id)
    results.push(`Sync completed: ${syncResult.imported} imported, ${syncResult.updated} updated`)

    return NextResponse.json({
      success: true,
      results,
      syncResult,
      store: {
        id: store.id,
        domain: store.domain,
        name: store.name
      }
    })

  } catch (error) {
    console.error("Reset error:", error)
    return NextResponse.json({
      success: false,
      results,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
