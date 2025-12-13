import { auth } from "@/lib/auth"
import { cookies } from "next/headers"

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
}

export interface Session {
  user: SessionUser
}

export async function getSession(): Promise<Session | null> {
  // Try NextAuth first
  try {
    const session = await auth()
    if (session?.user) {
      return {
        user: {
          id: session.user.id as string,
          email: session.user.email as string,
          name: session.user.name as string,
          role: session.user.role as string,
        }
      }
    }
  } catch (error) {
    console.log("NextAuth session error, checking dev session")
  }

  // Fall back to dev session cookie
  try {
    const cookieStore = await cookies()
    const devSession = cookieStore.get("dev-session")?.value
    if (devSession) {
      const parsed = JSON.parse(devSession)
      if (parsed?.user) {
        return {
          user: {
            id: parsed.user.id,
            email: parsed.user.email,
            name: parsed.user.name,
            role: parsed.user.role,
          }
        }
      }
    }
  } catch (error) {
    console.log("Dev session parse error")
  }

  return null
}
