import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")
  const domain = searchParams.get("domain")
  const token = searchParams.get("token")

  if (key !== "sellerdawn2024connect") {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 })
  }

  if (!domain || !token) {
    return NextResponse.json({ error: "Missing domain or token" }, { status: 400 })
  }

  try {
    // Clean domain
    const cleanDomain = domain
      .replace("https://", "")
      .replace("http://", "")
      .replace(/\/$/, "")

    // Test the connection
    const testUrl = `https://${cleanDomain}/admin/api/2024-01/shop.json`
    const testResponse = await fetch(testUrl, {
      headers: {
        "X-Shopify-Access-Token": token,
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
      store = await db.shopifyStore.update({
        where: { id: existingStore.id },
        data: {
          accessToken: token,
          name: shopData.shop?.name || cleanDomain,
          email: shopData.shop?.email,
          isActive: true,
        },
      })
    } else {
      store = await db.shopifyStore.create({
        data: {
          domain: cleanDomain,
          accessToken: token,
          name: shopData.shop?.name || cleanDomain,
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
        email: store.email,
      },
      shop: shopData.shop,
      message: "Store connected successfully! Now run /api/shopify/sync to import orders.",
    })
  } catch (error) {
    console.error("Connect error:", error)
    return NextResponse.json(
      { error: "Failed to connect", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    )
  }
}
