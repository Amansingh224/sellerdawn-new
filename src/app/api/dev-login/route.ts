import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { compare } from "bcryptjs"
import { SignJWT } from "jose"
import { cookies } from "next/headers"

export const dynamic = 'force-dynamic'

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-change-me-in-production-xyz123"
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")
  const password = searchParams.get("password")

  if (!email || !password) {
    return NextResponse.json({
      error: "Missing email or password",
      usage: "/api/dev-login?email=admin@sellerdawn.com&password=demo123"
    }, { status: 400 })
  }

  try {
    // Find user
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    // Check password
    const validPassword = await compare(password, user.password)
    if (!validPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Create a simple JWT token
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret)

    // Create the session token cookie that NextAuth expects
    const cookieStore = await cookies()

    // Set a simple session cookie
    cookieStore.set("dev-session", JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/"
    })

    // Also set the authjs session token
    cookieStore.set("authjs.session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/"
    })

    // Redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url))

  } catch (error) {
    console.error("Dev login error:", error)
    return NextResponse.json({
      error: "Login failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
