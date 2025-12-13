import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      nodeEnv: process.env.NODE_ENV,
    },
    database: { status: "checking" },
  }

  // Test database connection
  try {
    // Try a simple query
    const result = await db.$queryRaw`SELECT 1 as test`
    checks.database = { status: "connected", result }

    // Check if tables exist
    try {
      const userCount = await db.user.count()
      checks.database.tables = { users: userCount }
    } catch (tableError: any) {
      checks.database.tables = { error: tableError.message }
    }
  } catch (error: any) {
    checks.database = {
      status: "error",
      message: error.message,
      code: error.code
    }
  }

  const isHealthy = checks.database.status === "connected"

  return NextResponse.json(checks, {
    status: isHealthy ? 200 : 500
  })
}
