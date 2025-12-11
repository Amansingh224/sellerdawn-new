import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package,
  UserPlus,
  FileImage,
  CheckCircle,
  XCircle,
  Printer,
  Truck,
  Clock,
} from "lucide-react"

// Placeholder data - will be replaced with real data from timeline
const activities: {
  id: string
  action: string
  description: string
  time: string
  user?: string
}[] = []

const actionIcons: Record<string, React.ElementType> = {
  ORDER_IMPORTED: Package,
  DESIGNER_ASSIGNED: UserPlus,
  DRAFT_UPLOADED: FileImage,
  DRAFT_SENT: FileImage,
  DRAFT_APPROVED: CheckCircle,
  DRAFT_REJECTED: XCircle,
  PRINT_GROUP_CREATED: Printer,
  ORDER_FULFILLED: Truck,
  DEFAULT: Clock,
}

const actionColors: Record<string, string> = {
  ORDER_IMPORTED: "text-blue-500 bg-blue-500/10",
  DESIGNER_ASSIGNED: "text-purple-500 bg-purple-500/10",
  DRAFT_UPLOADED: "text-yellow-500 bg-yellow-500/10",
  DRAFT_SENT: "text-yellow-500 bg-yellow-500/10",
  DRAFT_APPROVED: "text-green-500 bg-green-500/10",
  DRAFT_REJECTED: "text-red-500 bg-red-500/10",
  PRINT_GROUP_CREATED: "text-indigo-500 bg-indigo-500/10",
  ORDER_FULFILLED: "text-green-500 bg-green-500/10",
  DEFAULT: "text-gray-500 bg-gray-500/10",
}

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Activity will appear here once you start processing orders
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = actionIcons[activity.action] || actionIcons.DEFAULT
              const colorClass = actionColors[activity.action] || actionColors.DEFAULT

              return (
                <div key={activity.id} className="flex gap-3">
                  <div className={`p-2 rounded-lg ${colorClass} shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {activity.user && (
                        <span className="text-xs text-muted-foreground">
                          by {activity.user}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
