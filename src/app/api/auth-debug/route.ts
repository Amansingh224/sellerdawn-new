import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  const debug = {
    timestamp: new Date().toISOString(),
    env: {
      hasAuthSecret: !!process.env.AUTH_SECRET,
      authSecretLength: process.env.AUTH_SECRET?.length || 0,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'not set',
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    }
  }

  return NextResponse.json(debug)
}
