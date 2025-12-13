import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Printer } from "lucide-react"

export default async function PrintQueuePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role === "DESIGNER") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Print Queue</h1>
        <p className="text-muted-foreground">
          Orders ready to print
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-3 mb-3">
            <Printer className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No orders in print queue</p>
          <p className="text-sm text-muted-foreground mt-1">
            Approved drafts will appear here automatically
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
