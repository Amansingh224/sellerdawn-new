"use client"

import { formatRelativeTime, formatDateTime } from "@/lib/utils"
import {
  Package,
  UserPlus,
  FileImage,
  CheckCircle,
  XCircle,
  Printer,
  Truck,
  Clock,
  MessageSquare,
  RefreshCw,
} from "lucide-react"

interface TimelineEvent {
  id: string
  action: string
  description: string
  createdAt: Date | string
  user: {
    id: string
    name: string
  } | null
}

interface OrderTimelineProps {
  events: TimelineEvent[]
}

const actionIcons: Record<string, React.ElementType> = {
  ORDER_IMPORTED: Package,
  ORDER_UPDATED: RefreshCw,
  DESIGNER_ASSIGNED: UserPlus,
  DRAFT_UPLOADED: FileImage,
  DRAFT_SENT: FileImage,
  DRAFT_APPROVED: CheckCircle,
  DRAFT_REJECTED: XCircle,
  DRAFT_AUTO_APPROVED: CheckCircle,
  ADDED_TO_PRINT_QUEUE: Printer,
  PRINT_GROUP_CREATED: Printer,
  QC_COMPLETED: CheckCircle,
  MARKED_PRINTED: Printer,
  TRACKING_ADDED: Truck,
  ORDER_FULFILLED: Truck,
  NOTE_ADDED: MessageSquare,
  STATUS_CHANGED: RefreshCw,
}

const actionColors: Record<string, string> = {
  ORDER_IMPORTED: "bg-blue-500",
  ORDER_UPDATED: "bg-gray-500",
  DESIGNER_ASSIGNED: "bg-purple-500",
  DRAFT_UPLOADED: "bg-yellow-500",
  DRAFT_SENT: "bg-yellow-500",
  DRAFT_APPROVED: "bg-green-500",
  DRAFT_REJECTED: "bg-red-500",
  DRAFT_AUTO_APPROVED: "bg-green-500",
  ADDED_TO_PRINT_QUEUE: "bg-indigo-500",
  PRINT_GROUP_CREATED: "bg-indigo-500",
  QC_COMPLETED: "bg-green-500",
  MARKED_PRINTED: "bg-green-500",
  TRACKING_ADDED: "bg-green-500",
  ORDER_FULFILLED: "bg-green-500",
  NOTE_ADDED: "bg-gray-500",
  STATUS_CHANGED: "bg-blue-500",
}

export function OrderTimeline({ events }: OrderTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No activity yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const Icon = actionIcons[event.action] || Clock
        const colorClass = actionColors[event.action] || "bg-gray-500"

        return (
          <div key={event.id} className="flex gap-4">
            {/* Icon */}
            <div className="relative">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${colorClass} text-white`}
              >
                <Icon className="h-4 w-4" />
              </div>
              {/* Connector line */}
              {index < events.length - 1 && (
                <div className="absolute left-1/2 top-8 w-0.5 h-full -translate-x-1/2 bg-border" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <p className="text-sm">{event.description}</p>
              <div className="flex items-center gap-2 mt-1">
                {event.user && (
                  <span className="text-xs text-muted-foreground">
                    by {event.user.name}
                  </span>
                )}
                <span
                  className="text-xs text-muted-foreground"
                  title={formatDateTime(event.createdAt)}
                >
                  {formatRelativeTime(event.createdAt)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
