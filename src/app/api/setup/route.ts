import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"

export async function GET(request: Request) {
  // Simple security - check for setup key
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")

  if (key !== "sellerdawn2024setup") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("🌱 Starting database setup...")

    // Create demo users
    const defaultPassword = await hash("demo123", 12)

    const admin = await db.user.upsert({
      where: { email: "admin@sellerdawn.com" },
      update: {},
      create: {
        email: "admin@sellerdawn.com",
        name: "Admin User",
        password: defaultPassword,
        role: "ADMIN",
      },
    })

    const designer = await db.user.upsert({
      where: { email: "designer@sellerdawn.com" },
      update: {},
      create: {
        email: "designer@sellerdawn.com",
        name: "Designer User",
        password: defaultPassword,
        role: "DESIGNER",
      },
    })

    const printer = await db.user.upsert({
      where: { email: "printer@sellerdawn.com" },
      update: {},
      create: {
        email: "printer@sellerdawn.com",
        name: "Printer User",
        password: defaultPassword,
        role: "PRINTER",
      },
    })

    // Create a demo Shopify store
    const store = await db.shopifyStore.upsert({
      where: { domain: "demo-store.myshopify.com" },
      update: {},
      create: {
        domain: "demo-store.myshopify.com",
        name: "Demo Store",
        accessToken: "placeholder-token",
        email: "store@example.com",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Database setup complete!",
      users: [
        { email: admin.email, role: admin.role },
        { email: designer.email, role: designer.role },
        { email: printer.email, role: printer.role },
      ],
      store: { name: store.name, domain: store.domain },
      credentials: {
        password: "demo123",
        note: "Use this password for all demo accounts"
      }
    })
  } catch (error: any) {
    console.error("Setup error:", error)
    return NextResponse.json({
      error: "Setup failed",
      details: error.message
    }, { status: 500 })
  }
}
