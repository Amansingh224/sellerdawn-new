import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")

  if (key !== "sellerdawn2024test") {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 })
  }

  try {
    // Get all stores
    const stores = await db.shopifyStore.findMany({
      select: {
        id: true,
        domain: true,
        name: true,
        email: true,
        isActive: true,
        accessToken: true,
        lastSyncAt: true,
        _count: { select: { orders: true } },
      },
    })

    // Test each store's connection
    const storeTests = await Promise.all(
      stores.map(async (store) => {
        try {
          const testUrl = `https://${store.domain}/admin/api/2024-01/shop.json`
          const response = await fetch(testUrl, {
            headers: {
              "X-Shopify-Access-Token": store.accessToken,
              "Content-Type": "application/json",
            },
          })

          if (response.ok) {
            const data = await response.json()
            return {
              id: store.id,
              domain: store.domain,
              name: store.name,
              isActive: store.isActive,
              lastSyncAt: store.lastSyncAt,
              ordersCount: store._count.orders,
              connectionStatus: "OK",
              shopName: data.shop?.name,
              tokenPreview: `${store.accessToken.substring(0, 10)}...`,
            }
          } else {
            const error = await response.text()
            return {
              id: store.id,
              domain: store.domain,
              name: store.name,
              isActive: store.isActive,
              connectionStatus: "FAILED",
              error: error,
              tokenPreview: `${store.accessToken.substring(0, 10)}...`,
            }
          }
        } catch (err) {
          return {
            id: store.id,
            domain: store.domain,
            connectionStatus: "ERROR",
            error: err instanceof Error ? err.message : "Unknown error",
          }
        }
      })
    )

    return NextResponse.json({
      storesFound: stores.length,
      stores: storeTests,
    })
  } catch (error) {
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown",
    }, { status: 500 })
  }
}
