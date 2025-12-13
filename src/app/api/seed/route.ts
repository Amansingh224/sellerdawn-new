import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")

  if (key !== "sellerdawn2024seed") {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 })
  }

  try {
    // Get the admin user for assigning orders
    const admin = await db.user.findFirst({ where: { role: "ADMIN" } })
    const designer = await db.user.findFirst({ where: { role: "DESIGNER" } })

    if (!admin) {
      return NextResponse.json({ error: "Run /api/setup first to create users" }, { status: 400 })
    }

    // Create or get demo store
    let store = await db.shopifyStore.findUnique({
      where: { domain: "demo-store.myshopify.com" }
    })

    if (!store) {
      store = await db.shopifyStore.create({
        data: {
          domain: "demo-store.myshopify.com",
          accessToken: "demo-token",
          name: "Demo Store",
          email: "demo@sellerdawn.com",
          isActive: true,
        }
      })
    }

    // Sample customer data
    const customers = [
      { firstName: "John", lastName: "Smith", email: "john@example.com" },
      { firstName: "Sarah", lastName: "Johnson", email: "sarah@example.com" },
      { firstName: "Mike", lastName: "Williams", email: "mike@example.com" },
      { firstName: "Emily", lastName: "Brown", email: "emily@example.com" },
      { firstName: "David", lastName: "Lee", email: "david@example.com" },
    ]

    // Sample products
    const products = [
      { title: "Custom T-Shirt - Black", sku: "TSH-BLK-001", variant: "Large" },
      { title: "Custom Hoodie - Navy", sku: "HOD-NAV-002", variant: "Medium" },
      { title: "Custom Mug - White", sku: "MUG-WHT-003", variant: "11oz" },
      { title: "Custom Poster - Glossy", sku: "POS-GLS-004", variant: "18x24" },
      { title: "Custom Phone Case", sku: "PHN-CSE-005", variant: "iPhone 14" },
      { title: "Custom Tote Bag", sku: "TOT-BAG-006", variant: "Standard" },
    ]

    // Valid OrderStatus enum values
    const statuses = ["IMPORTED", "ASSIGNED", "DRAFT_SENT", "DRAFT_APPROVED", "PENDING_PRINT", "PRINTED", "FULFILLED"]

    const createdOrders = []

    // Create 15 sample orders
    for (let i = 0; i < 15; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)]
      const product = products[Math.floor(Math.random() * products.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      // Determine if order should have a designer assigned
      const shouldAssign = status !== "IMPORTED"

      const order = await db.order.create({
        data: {
          shopifyId: `SHOP-${Date.now()}-${i}`,
          orderNumber: `${1000 + i}`,
          name: `#${1000 + i}`,
          customerFirstName: customer.firstName,
          customerLastName: customer.lastName,
          customerEmail: customer.email,
          status: status as any,
          totalPrice: parseFloat((Math.random() * 100 + 20).toFixed(2)),
          financialStatus: "paid",
          storeId: store.id,
          designerId: shouldAssign && designer ? designer.id : null,
          lineItems: {
            create: [
              {
                shopifyId: `LINE-${Date.now()}-${i}`,
                title: product.title,
                variantTitle: product.variant,
                sku: product.sku,
                quantity: Math.floor(Math.random() * 3) + 1,
                price: parseFloat((Math.random() * 50 + 10).toFixed(2)),
              }
            ]
          },
          timelineEvents: {
            create: [
              {
                action: "Order created",
                performedById: admin.id,
                details: { source: "Seed data" }
              }
            ]
          }
        }
      })

      createdOrders.push({
        id: order.id,
        orderNumber: order.name,
        customer: `${customer.firstName} ${customer.lastName}`,
        status: order.status,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdOrders.length} sample orders`,
      store: { id: store.id, name: store.name },
      orders: createdOrders
    })

  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json({
      error: "Failed to seed data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
