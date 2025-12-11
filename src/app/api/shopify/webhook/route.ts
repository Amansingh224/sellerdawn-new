import { NextResponse } from "next/server"
import { headers } from "next/headers"
import crypto from "crypto"
import { db } from "@/lib/db"
import { syncShopifyOrders } from "@/lib/shopify/sync"

// Verify Shopify webhook signature
function verifyWebhook(body: string, signature: string, secret: string): boolean {
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64")

  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature))
}

export async function POST(request: Request) {
  try {
    const headersList = headers()
    const signature = headersList.get("x-shopify-hmac-sha256")
    const topic = headersList.get("x-shopify-topic")
    const shopDomain = headersList.get("x-shopify-shop-domain")

    const body = await request.text()

    // Get store and verify webhook
    const store = await db.shopifyStore.findUnique({
      where: { domain: shopDomain || "" },
    })

    if (store?.webhookSecret && signature) {
      const isValid = verifyWebhook(body, signature, store.webhookSecret)
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        )
      }
    }

    const data = JSON.parse(body)

    // Handle different webhook topics
    switch (topic) {
      case "orders/create":
      case "orders/updated":
        // Trigger a sync for this specific store
        if (store) {
          await syncShopifyOrders(store.id)
        }
        break

      case "orders/fulfilled":
        // Update order status
        if (data.id) {
          await db.order.updateMany({
            where: { shopifyId: String(data.id) },
            data: {
              fulfillmentStatus: "fulfilled",
            },
          })
        }
        break

      case "app/uninstalled":
        // Deactivate store
        if (store) {
          await db.shopifyStore.update({
            where: { id: store.id },
            data: { isActive: false },
          })
        }
        break

      default:
        console.log(`Unhandled webhook topic: ${topic}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
