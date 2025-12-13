import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")

  if (key !== "sellerdawn2024cleanup") {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 })
  }

  try {
    // Delete demo store and its orders
    const demoStore = await db.shopifyStore.findUnique({
      where: { domain: "demo-store.myshopify.com" },
    })

    if (demoStore) {
      // Delete orders from demo store first (cascade should handle this but let's be safe)
      await db.order.deleteMany({
        where: { storeId: demoStore.id },
      })

      // Delete the demo store
      await db.shopifyStore.delete({
        where: { id: demoStore.id },
      })

      return NextResponse.json({
        success: true,
        message: "Demo store and orders deleted",
        deletedStoreId: demoStore.id,
      })
    }

    return NextResponse.json({
      success: true,
      message: "No demo store found",
    })
  } catch (error) {
    return NextResponse.json({
      error: "Cleanup failed",
      details: error instanceof Error ? error.message : "Unknown",
    }, { status: 500 })
  }
}
