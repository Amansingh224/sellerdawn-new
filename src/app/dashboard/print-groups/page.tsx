import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { ClipboardList } from "lucide-react"

export default async function PrintGroupsPage() {
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
        <h1 className="text-2xl font-bold tracking-tight">Print Groups</h1>
        <p className="text-muted-foreground">
          Manage batches of orders for printing
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-3 mb-3">
            <ClipboardList className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No print groups created</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create print groups from the print queue
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
