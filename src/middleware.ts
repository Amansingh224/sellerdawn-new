import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // Check for dev session cookie as fallback
  const devSession = req.cookies.get("dev-session")?.value
  let devUser = null
  if (devSession) {
    try {
      devUser = JSON.parse(devSession)?.user
    } catch {}
  }
  const hasDevSession = !!devUser

  // Public routes
  const publicRoutes = ["/login", "/approval"]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // API routes that should be public
  const isAuthApi = pathname.startsWith("/api/auth")
  const isShopifyWebhook = pathname.startsWith("/api/shopify/webhook")
  const isApprovalApi = pathname.startsWith("/api/approval")
  const isHealthApi = pathname === "/api/health"
  const isSetupApi = pathname === "/api/setup"
  const isDebugApi = pathname === "/api/auth-debug"
  const isSeedApi = pathname === "/api/seed"
  const isDevLoginApi = pathname === "/api/dev-login"
  const isQuickConnectApi = pathname === "/api/shopify/quick-connect"
  const isQuickSyncApi = pathname === "/api/shopify/quick-sync"
  const isShopifyTestApi = pathname === "/api/shopify/test"
  const isCronApi = pathname === "/api/cron/sync"

  // Allow public routes
  if (isPublicRoute || isAuthApi || isShopifyWebhook || isApprovalApi || isHealthApi || isSetupApi || isDebugApi || isSeedApi || isDevLoginApi || isQuickConnectApi || isQuickSyncApi || isShopifyTestApi || isCronApi) {
    return
  }

  // Check if user is authenticated (NextAuth or dev session)
  const isAuthenticated = isLoggedIn || hasDevSession

  // Redirect to login if not authenticated
  if (!isAuthenticated && pathname !== "/") {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return Response.redirect(loginUrl)
  }

  // Redirect root to dashboard if logged in
  if (isAuthenticated && pathname === "/") {
    return Response.redirect(new URL("/dashboard", req.url))
  }

  // Role-based access control
  const role = req.auth?.user?.role || devUser?.role
  if (isAuthenticated && role) {
    // Admin-only routes
    if (pathname.startsWith("/dashboard/admin") && role !== "ADMIN") {
      return Response.redirect(new URL("/dashboard", req.url))
    }

    // Designer routes
    if (pathname.startsWith("/dashboard/designer") && !["ADMIN", "DESIGNER"].includes(role)) {
      return Response.redirect(new URL("/dashboard", req.url))
    }

    // Printer routes
    if (pathname.startsWith("/dashboard/printer") && !["ADMIN", "PRINTER"].includes(role)) {
      return Response.redirect(new URL("/dashboard", req.url))
    }
  }
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
