import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UserRole } from "@prisma/client"

export const dynamic = 'force-dynamic'

export default async function DesignersPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const designers = await db.user.findMany({
    where: {
      role: UserRole.DESIGNER,
      isActive: true,
    },
    include: {
      _count: {
        select: {
          assignedOrders: true,
          drafts: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Designers</h1>
        <p className="text-muted-foreground">
          Manage designer accounts and view performance
        </p>
      </div>

      {designers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No designers found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add designers through the team settings
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {designers.map((designer) => (
            <Card key={designer.id}>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {designer.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{designer.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {designer.email}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1 text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">
                      {designer._count.assignedOrders}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Assigned Orders
                    </p>
                  </div>
                  <div className="flex-1 text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">
                      {designer._count.drafts}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total Drafts
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
