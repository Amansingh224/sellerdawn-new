import { db } from "@/lib/db"
import { getShopifyClient, extractCustomerImages } from "./client"
import { OrderStatus, TimelineAction } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

interface SyncResult {
  success: boolean
  imported: number
  updated: number
  errors: string[]
}

export async function syncShopifyOrders(storeId?: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    imported: 0,
    updated: 0,
    errors: [],
  }

  try {
    const client = await getShopifyClient(storeId)

    if (!client) {
      result.errors.push("No active Shopify store found")
      return result
    }

    // Get the store
    const store = storeId
      ? await db.shopifyStore.findUnique({ where: { id: storeId } })
      : await db.shopifyStore.findFirst({ where: { isActive: true } })

    if (!store) {
      result.errors.push("Store not found")
      return result
    }

    // Get last sync time to do incremental sync
    const lastSync = store.lastSyncAt

    // Fetch orders from Shopify
    const orders = await client.getOrders({
      limit: 250,
      created_at_min: lastSync?.toISOString(),
    })

    for (const shopifyOrder of orders) {
      try {
        const shopifyId = String(shopifyOrder.id)

        // Check if order exists
        const existingOrder = await db.order.findUnique({
          where: { shopifyId },
        })

        const orderData = {
          shopifyId,
          orderNumber: String(shopifyOrder.order_number),
          name: shopifyOrder.name,
          financialStatus: shopifyOrder.financial_status,
          fulfillmentStatus: shopifyOrder.fulfillment_status,
          totalPrice: shopifyOrder.total_price ? new Decimal(shopifyOrder.total_price) : null,
          currency: shopifyOrder.currency,
          customerEmail: shopifyOrder.email || shopifyOrder.customer?.email,
          customerPhone: shopifyOrder.phone || shopifyOrder.customer?.phone,
          customerFirstName: shopifyOrder.customer?.first_name,
          customerLastName: shopifyOrder.customer?.last_name,
          shippingFirstName: shopifyOrder.shipping_address?.first_name,
          shippingLastName: shopifyOrder.shipping_address?.last_name,
          shippingAddress1: shopifyOrder.shipping_address?.address1,
          shippingAddress2: shopifyOrder.shipping_address?.address2,
          shippingCity: shopifyOrder.shipping_address?.city,
          shippingProvince: shopifyOrder.shipping_address?.province,
          shippingCountry: shopifyOrder.shipping_address?.country,
          shippingZip: shopifyOrder.shipping_address?.zip,
          shippingPhone: shopifyOrder.shipping_address?.phone,
          tags: shopifyOrder.tags ? shopifyOrder.tags.split(", ").filter(Boolean) : [],
          note: shopifyOrder.note,
          shopifyNote: shopifyOrder.note,
          shopifyCreatedAt: new Date(shopifyOrder.created_at),
          shopifyUpdatedAt: new Date(shopifyOrder.updated_at),
          storeId: store.id,
        }

        if (existingOrder) {
          // Update existing order
          await db.order.update({
            where: { id: existingOrder.id },
            data: orderData,
          })
          result.updated++
        } else {
          // Create new order
          const newOrder = await db.order.create({
            data: {
              ...orderData,
              status: OrderStatus.IMPORTED,
            },
          })

          // Create line items
          for (const item of shopifyOrder.line_items) {
            await db.lineItem.create({
              data: {
                shopifyId: String(item.id),
                orderId: newOrder.id,
                title: item.title,
                variantTitle: item.variant_title,
                sku: item.sku,
                quantity: item.quantity,
                price: item.price ? new Decimal(item.price) : null,
                productId: item.product_id ? String(item.product_id) : null,
                variantId: item.variant_id ? String(item.variant_id) : null,
                properties: item.properties || [],
              },
            })
          }

          // Extract and store customer images
          const imageUrls = extractCustomerImages(shopifyOrder)
          for (const url of imageUrls) {
            await db.customerImage.create({
              data: {
                orderId: newOrder.id,
                filename: url.split("/").pop() || "image",
                originalUrl: url,
              },
            })
          }

          // Create timeline entry
          await db.timelineEvent.create({
            data: {
              orderId: newOrder.id,
              action: TimelineAction.ORDER_IMPORTED,
              description: `Order ${shopifyOrder.name} imported from Shopify`,
              metadata: {
                shopifyOrderId: shopifyId,
                orderNumber: shopifyOrder.order_number,
              },
            },
          })

          result.imported++
        }
      } catch (orderError) {
        result.errors.push(
          `Error processing order ${shopifyOrder.name}: ${
            orderError instanceof Error ? orderError.message : "Unknown error"
          }`
        )
      }
    }

    // Update last sync time
    await db.shopifyStore.update({
      where: { id: store.id },
      data: { lastSyncAt: new Date() },
    })

    result.success = true
  } catch (error) {
    result.errors.push(
      `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }

  return result
}

// Sync Shopify notes when timeline events are created
export async function syncTimelineToShopify(
  orderId: string,
  description: string,
  userName?: string
): Promise<void> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    })

    if (!order) return

    const client = await getShopifyClient(order.storeId)
    if (!client) return

    // Get current note
    const currentNote = order.shopifyNote || ""

    // Format new note entry
    const timestamp = new Date().toLocaleString()
    const newEntry = userName
      ? `${description} — ${timestamp} by ${userName}`
      : `${description} — ${timestamp}`

    // Append to note
    const updatedNote = currentNote
      ? `${currentNote}\n${newEntry}`
      : newEntry

    // Update Shopify order
    await client.addOrderNote(order.shopifyId, updatedNote)

    // Update local record
    await db.order.update({
      where: { id: orderId },
      data: { shopifyNote: updatedNote },
    })
  } catch (error) {
    console.error("Failed to sync timeline to Shopify:", error)
  }
}
