import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Analytics and performance reports
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Volume</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Charts coming soon...</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Designer Performance</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Charts coming soon...</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Approval Rates</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Charts coming soon...</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fulfillment Times</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Charts coming soon...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
