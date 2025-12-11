import { PrismaClient, UserRole } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seed...")

  // Create demo users
  const defaultPassword = await hash("demo123", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@sellerdawn.com" },
    update: {},
    create: {
      email: "admin@sellerdawn.com",
      name: "Admin User",
      password: defaultPassword,
      role: UserRole.ADMIN,
    },
  })

  const designer = await prisma.user.upsert({
    where: { email: "designer@sellerdawn.com" },
    update: {},
    create: {
      email: "designer@sellerdawn.com",
      name: "Designer User",
      password: defaultPassword,
      role: UserRole.DESIGNER,
    },
  })

  const printer = await prisma.user.upsert({
    where: { email: "printer@sellerdawn.com" },
    update: {},
    create: {
      email: "printer@sellerdawn.com",
      name: "Printer User",
      password: defaultPassword,
      role: UserRole.PRINTER,
    },
  })

  console.log("✅ Created demo users:")
  console.log(`   - Admin: ${admin.email}`)
  console.log(`   - Designer: ${designer.email}`)
  console.log(`   - Printer: ${printer.email}`)
  console.log("   - Password for all: demo123")

  // Create a demo Shopify store (placeholder)
  const store = await prisma.shopifyStore.upsert({
    where: { domain: "demo-store.myshopify.com" },
    update: {},
    create: {
      domain: "demo-store.myshopify.com",
      name: "Demo Store",
      accessToken: "placeholder-token",
      email: "store@example.com",
    },
  })

  console.log(`✅ Created demo store: ${store.name}`)

  console.log("\n🎉 Database seeded successfully!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
