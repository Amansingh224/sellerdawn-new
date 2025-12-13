import { NextResponse } from "next/server"
import { getApiSession } from "@/lib/api-session"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getApiSession()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { domain, accessToken, name } = body

    if (!domain || !accessToken) {
      return NextResponse.json(
        { error: "Missing domain or accessToken" },
        { status: 400 }
      )
    }

    // Clean domain
    const cleanDomain = domain
      .replace("https://", "")
      .replace("http://", "")
      .replace(/\/$/, "")

    // Test the connection
    const testUrl = `https://${cleanDomain}/admin/api/2024-01/shop.json`
    const testResponse = await fetch(testUrl, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    })

    if (!testResponse.ok) {
      const error = await testResponse.text()
      return NextResponse.json(
        { error: "Failed to connect to Shopify", details: error },
        { status: 400 }
      )
    }

    const shopData = await testResponse.json()

    // Check if store already exists
    const existingStore = await db.shopifyStore.findUnique({
      where: { domain: cleanDomain },
    })

    let store
    if (existingStore) {
      // Update existing store
      store = await db.shopifyStore.update({
        where: { id: existingStore.id },
        data: {
          accessToken,
          name: name || shopData.shop?.name || cleanDomain,
          email: shopData.shop?.email,
          isActive: true,
        },
      })
    } else {
      // Create new store
      store = await db.shopifyStore.create({
        data: {
          domain: cleanDomain,
          accessToken,
          name: name || shopData.shop?.name || cleanDomain,
          email: shopData.shop?.email,
          isActive: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      store: {
        id: store.id,
        domain: store.domain,
        name: store.name,
      },
      message: existingStore ? "Store updated successfully" : "Store connected successfully",
    })
  } catch (error) {
    console.error("Connect error:", error)
    return NextResponse.json(
      { error: "Failed to connect store", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// GET - List connected stores
export async function GET() {
  try {
    const session = await getApiSession()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const stores = await db.shopifyStore.findMany({
      select: {
        id: true,
        domain: true,
        name: true,
        email: true,
        isActive: true,
        lastSyncAt: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ stores })
  } catch (error) {
    console.error("List stores error:", error)
    return NextResponse.json(
      { error: "Failed to list stores" },
      { status: 500 }
    )
  }
}
