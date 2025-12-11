import { db } from "@/lib/db"

interface ShopifyConfig {
  domain: string
  accessToken: string
  apiVersion: string
}

interface ShopifyOrder {
  id: number
  name: string
  order_number: number
  financial_status: string
  fulfillment_status: string | null
  total_price: string
  currency: string
  email: string
  phone: string | null
  created_at: string
  updated_at: string
  note: string | null
  tags: string
  customer: {
    id: number
    email: string
    first_name: string
    last_name: string
    phone: string | null
  } | null
  shipping_address: {
    first_name: string
    last_name: string
    address1: string
    address2: string | null
    city: string
    province: string
    country: string
    zip: string
    phone: string | null
  } | null
  line_items: Array<{
    id: number
    title: string
    variant_title: string | null
    sku: string | null
    quantity: number
    price: string
    product_id: number
    variant_id: number
    properties: Array<{
      name: string
      value: string
    }>
  }>
  note_attributes: Array<{
    name: string
    value: string
  }>
}

interface ShopifyOrdersResponse {
  orders: ShopifyOrder[]
}

export class ShopifyClient {
  private config: ShopifyConfig

  constructor(config: ShopifyConfig) {
    this.config = config
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `https://${this.config.domain}/admin/api/${this.config.apiVersion}/${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.config.accessToken,
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Shopify API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async getOrders(params?: {
    limit?: number
    since_id?: string
    created_at_min?: string
    status?: string
  }): Promise<ShopifyOrder[]> {
    const searchParams = new URLSearchParams()
    searchParams.set("limit", String(params?.limit || 250))
    searchParams.set("status", params?.status || "any")

    if (params?.since_id) {
      searchParams.set("since_id", params.since_id)
    }
    if (params?.created_at_min) {
      searchParams.set("created_at_min", params.created_at_min)
    }

    const response = await this.request<ShopifyOrdersResponse>(
      `orders.json?${searchParams.toString()}`
    )

    return response.orders
  }

  async getOrder(orderId: string): Promise<ShopifyOrder> {
    const response = await this.request<{ order: ShopifyOrder }>(
      `orders/${orderId}.json`
    )
    return response.order
  }

  async updateOrderTags(orderId: string, tags: string[]): Promise<void> {
    await this.request(`orders/${orderId}.json`, {
      method: "PUT",
      body: JSON.stringify({
        order: {
          id: orderId,
          tags: tags.join(", "),
        },
      }),
    })
  }

  async addOrderNote(orderId: string, note: string): Promise<void> {
    await this.request(`orders/${orderId}.json`, {
      method: "PUT",
      body: JSON.stringify({
        order: {
          id: orderId,
          note,
        },
      }),
    })
  }

  async fulfillOrder(
    orderId: string,
    trackingNumber: string,
    trackingCompany: string
  ): Promise<void> {
    // First get fulfillment orders
    const fulfillmentOrdersResponse = await this.request<{
      fulfillment_orders: Array<{ id: number; line_items: Array<{ id: number }> }>
    }>(`orders/${orderId}/fulfillment_orders.json`)

    const fulfillmentOrder = fulfillmentOrdersResponse.fulfillment_orders[0]

    if (!fulfillmentOrder) {
      throw new Error("No fulfillment order found")
    }

    // Create fulfillment
    await this.request("fulfillments.json", {
      method: "POST",
      body: JSON.stringify({
        fulfillment: {
          line_items_by_fulfillment_order: [
            {
              fulfillment_order_id: fulfillmentOrder.id,
            },
          ],
          tracking_info: {
            number: trackingNumber,
            company: trackingCompany,
          },
          notify_customer: true,
        },
      }),
    })
  }
}

// Helper to get client from store
export async function getShopifyClient(storeId?: string): Promise<ShopifyClient | null> {
  const store = storeId
    ? await db.shopifyStore.findUnique({ where: { id: storeId } })
    : await db.shopifyStore.findFirst({ where: { isActive: true } })

  if (!store) {
    return null
  }

  return new ShopifyClient({
    domain: store.domain,
    accessToken: store.accessToken,
    apiVersion: process.env.SHOPIFY_API_VERSION || "2024-01",
  })
}

// Extract customer uploaded images from order properties
export function extractCustomerImages(order: ShopifyOrder): string[] {
  const images: string[] = []

  for (const item of order.line_items) {
    if (item.properties) {
      for (const prop of item.properties) {
        // Look for common image property names
        if (
          prop.name.toLowerCase().includes("image") ||
          prop.name.toLowerCase().includes("photo") ||
          prop.name.toLowerCase().includes("upload") ||
          prop.name.toLowerCase().includes("file") ||
          prop.name.toLowerCase().includes("artwork")
        ) {
          // Check if it looks like a URL
          if (prop.value.startsWith("http") || prop.value.startsWith("//")) {
            images.push(prop.value.startsWith("//") ? `https:${prop.value}` : prop.value)
          }
        }
      }
    }
  }

  // Also check note_attributes
  if (order.note_attributes) {
    for (const attr of order.note_attributes) {
      if (
        attr.name.toLowerCase().includes("image") ||
        attr.name.toLowerCase().includes("upload")
      ) {
        if (attr.value.startsWith("http") || attr.value.startsWith("//")) {
          images.push(attr.value.startsWith("//") ? `https:${attr.value}` : attr.value)
        }
      }
    }
  }

  return [...new Set(images)] // Remove duplicates
}
