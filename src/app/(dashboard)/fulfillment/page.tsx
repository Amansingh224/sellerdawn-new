import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Truck } from "lucide-react"

export default async function FulfillmentPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fulfillment</h1>
        <p className="text-muted-foreground">
          Add tracking numbers and fulfill orders
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-3 mb-3">
            <Truck className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No orders pending fulfillment</p>
          <p className="text-sm text-muted-foreground mt-1">
            Printed orders will appear here for tracking upload
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
