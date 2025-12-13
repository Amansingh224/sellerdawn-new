import { getSession } from "@/lib/get-session"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { XCircle } from "lucide-react"

export default async function RejectionsPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Draft Rejections</h1>
        <p className="text-muted-foreground">
          Drafts that need revision
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-3 mb-3">
            <XCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No rejected drafts</p>
          <p className="text-sm text-muted-foreground mt-1">
            Rejected drafts will appear here for revision
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
