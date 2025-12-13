import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { db } from "@/lib/db"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role as string
        token.name = user.name as string
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.name = token.name as string
      }
      return session
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard")
      const isOnLogin = request.nextUrl.pathname === "/login"

      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect to login
      } else if (isOnLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", request.nextUrl))
        }
      }
      return true
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const validatedFields = loginSchema.safeParse(credentials)

          if (!validatedFields.success) {
            console.log("Auth: Invalid credentials format")
            return null
          }

          const { email, password } = validatedFields.data

          const user = await db.user.findUnique({
            where: { email },
          })

          if (!user || !user.password) {
            console.log("Auth: User not found:", email)
            return null
          }

          const passwordMatch = await compare(password, user.password)

          if (!passwordMatch) {
            console.log("Auth: Password mismatch for:", email)
            return null
          }

          if (!user.isActive) {
            console.log("Auth: User inactive:", email)
            return null
          }

          console.log("Auth: Login successful for:", email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
})
