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

    // Sample customer data
    const customers = [
      { name: "John Smith", email: "john@example.com" },
      { name: "Sarah Johnson", email: "sarah@example.com" },
      { name: "Mike Williams", email: "mike@example.com" },
      { name: "Emily Brown", email: "emily@example.com" },
      { name: "David Lee", email: "david@example.com" },
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

    // Sample image URLs (placeholder images)
    const sampleImages = [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400",
    ]

    const statuses = ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS", "PENDING_APPROVAL", "APPROVED", "PRINTING", "SHIPPED"]
    const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"]

    const createdOrders = []

    // Create 15 sample orders
    for (let i = 0; i < 15; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)]
      const product = products[Math.floor(Math.random() * products.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const priority = priorities[Math.floor(Math.random() * priorities.length)]

      // Determine if order should have a designer assigned
      const shouldAssign = status !== "PENDING_ASSIGNMENT"

      const order = await db.order.create({
        data: {
          shopifyOrderId: `SHOP-${Date.now()}-${i}`,
          shopifyOrderNumber: `#${1000 + i}`,
          customerName: customer.name,
          customerEmail: customer.email,
          status: status as any,
          priority: priority as any,
          dueDate: new Date(Date.now() + (Math.random() * 14 + 1) * 24 * 60 * 60 * 1000), // 1-15 days from now
          designerId: shouldAssign && designer ? designer.id : null,
          lineItems: {
            create: [
              {
                shopifyLineItemId: `LINE-${Date.now()}-${i}`,
                productTitle: product.title,
                variantTitle: product.variant,
                sku: product.sku,
                quantity: Math.floor(Math.random() * 3) + 1,
                price: parseFloat((Math.random() * 50 + 10).toFixed(2)),
                requiresDesign: true,
                designStatus: shouldAssign ? "IN_PROGRESS" : "PENDING",
                customerImages: sampleImages.slice(0, Math.floor(Math.random() * 2) + 1),
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
        orderNumber: order.shopifyOrderNumber,
        customer: customer.name,
        status: order.status,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdOrders.length} sample orders`,
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
