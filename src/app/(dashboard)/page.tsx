import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardStats } from "@/components/dashboard/stats"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { ActivityFeed } from "@/components/dashboard/activity-feed"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome back, {session.user.name?.split(" ")[0]}!
        </h2>
        <p className="text-muted-foreground">
          Here's what's happening with your orders today.
        </p>
      </div>

      {/* Stats Cards */}
      <DashboardStats userRole={session.user.role} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <RecentOrders />

        {/* Activity Feed */}
        <ActivityFeed />
      </div>
    </div>
  )
}
