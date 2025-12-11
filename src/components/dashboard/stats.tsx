import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  FileImage,
  Printer,
  Truck,
  Users,
} from "lucide-react"

interface StatsProps {
  userRole: string
}

const adminStats = [
  {
    title: "Total Orders",
    value: "0",
    description: "All time",
    icon: Package,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Pending Assignment",
    value: "0",
    description: "Needs designer",
    icon: Clock,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    title: "Awaiting Approval",
    value: "0",
    description: "Drafts sent",
    icon: FileImage,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    title: "Ready to Print",
    value: "0",
    description: "Approved drafts",
    icon: Printer,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
]

const designerStats = [
  {
    title: "Assigned Orders",
    value: "0",
    description: "Your queue",
    icon: Package,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Drafts Pending",
    value: "0",
    description: "Awaiting approval",
    icon: Clock,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    title: "Rejections",
    value: "0",
    description: "Needs revision",
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    title: "Completed Today",
    value: "0",
    description: "Approved",
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
]

const printerStats = [
  {
    title: "Print Queue",
    value: "0",
    description: "Ready to print",
    icon: Printer,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "In Progress",
    value: "0",
    description: "Currently printing",
    icon: Clock,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    title: "QC Pending",
    value: "0",
    description: "Needs verification",
    icon: AlertCircle,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    title: "Completed Today",
    value: "0",
    description: "Printed & ready",
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
]

export function DashboardStats({ userRole }: StatsProps) {
  const getStats = () => {
    switch (userRole) {
      case "ADMIN":
        return adminStats
      case "DESIGNER":
        return designerStats
      case "PRINTER":
        return printerStats
      default:
        return []
    }
  }

  const stats = getStats()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
