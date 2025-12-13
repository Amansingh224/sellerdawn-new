"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  FileImage,
  Printer,
} from "lucide-react"

interface StatsProps {
  userRole: string
}

interface StatItem {
  title: string
  value: number
  description: string
  icon: any
  color: string
  bgColor: string
}

export function DashboardStats({ userRole }: StatsProps) {
  const [stats, setStats] = useState<{ key: string; value: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/stats")
        const data = await response.json()
        setStats(data.stats || [])
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const getStatValue = (key: string) => {
    const stat = stats.find(s => s.key === key)
    return stat?.value ?? 0
  }

  const adminStats: StatItem[] = [
    {
      title: "Total Orders",
      value: getStatValue("total"),
      description: "All time",
      icon: Package,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Pending Assignment",
      value: getStatValue("imported"),
      description: "Needs designer",
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Awaiting Approval",
      value: getStatValue("draftSent"),
      description: "Drafts sent",
      icon: FileImage,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Ready to Print",
      value: getStatValue("approved"),
      description: "Approved drafts",
      icon: Printer,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ]

  const designerStats: StatItem[] = [
    {
      title: "Assigned Orders",
      value: getStatValue("assigned"),
      description: "Your queue",
      icon: Package,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Drafts Pending",
      value: getStatValue("draftSent"),
      description: "Awaiting approval",
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Rejections",
      value: getStatValue("rejected"),
      description: "Needs revision",
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Completed Today",
      value: getStatValue("completedToday"),
      description: "Approved",
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ]

  const printerStats: StatItem[] = [
    {
      title: "Print Queue",
      value: getStatValue("printQueue"),
      description: "Ready to print",
      icon: Printer,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Printed",
      value: getStatValue("printed"),
      description: "Completed",
      icon: CheckCircle,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Fulfilled",
      value: getStatValue("fulfilled"),
      description: "Shipped",
      icon: Package,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Completed Today",
      value: getStatValue("completedToday"),
      description: "Printed & ready",
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ]

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

  const displayStats = getStats()

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {displayStats.map((stat) => (
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
