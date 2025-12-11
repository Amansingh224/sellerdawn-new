"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatRelativeTime, formatCurrency } from "@/lib/utils"
import {
  Search,
  MoreHorizontal,
  Eye,
  UserPlus,
  FileImage,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react"
import { AssignDesignerDialog } from "./assign-designer-dialog"

interface Order {
  id: string
  orderNumber: string
  name: string
  status: string
  customerEmail: string | null
  customerFirstName: string | null
  customerLastName: string | null
  totalPrice: string | null
  currency: string | null
  createdAt: string
  designer: {
    id: string
    name: string
  } | null
  lineItems: Array<{
    id: string
    title: string
    quantity: number
  }>
  customerImages: Array<{
    id: string
    originalUrl: string
  }>
  _count: {
    drafts: number
    timelineEvents: number
  }
}

interface OrdersTableProps {
  userRole: string
  userId: string
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "IMPORTED", label: "Imported" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "DRAFT_SENT", label: "Draft Sent" },
  { value: "DRAFT_APPROVED", label: "Approved" },
  { value: "DRAFT_REJECTED", label: "Rejected" },
  { value: "PENDING_PRINT", label: "Pending Print" },
  { value: "PRINTED", label: "Printed" },
  { value: "FULFILLED", label: "Fulfilled" },
]

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
  IMPORTED: "secondary",
  ASSIGNED: "info",
  DRAFT_SENT: "warning",
  DRAFT_APPROVED: "success",
  DRAFT_REJECTED: "destructive",
  PENDING_PRINT: "warning",
  PRINTED: "info",
  FULFILLED: "success",
}

const statusLabels: Record<string, string> = {
  IMPORTED: "Imported",
  ASSIGNED: "Assigned",
  DRAFT_SENT: "Draft Sent",
  DRAFT_APPROVED: "Approved",
  DRAFT_REJECTED: "Rejected",
  PENDING_PRINT: "Pending Print",
  PRINTED: "Printed",
  FULFILLED: "Fulfilled",
}

export function OrdersTable({ userRole, userId }: OrdersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [status, setStatus] = useState(searchParams.get("status") || "all")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(pagination.page))
      params.set("limit", String(pagination.limit))
      if (search) params.set("search", search)
      if (status && status !== "all") params.set("status", status)

      const response = await fetch(`/api/orders?${params.toString()}`)
      const data = await response.json()

      setOrders(data.orders || [])
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }))
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, status])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(orders.map((o) => o.id))
    } else {
      setSelectedOrders([])
    }
  }

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders((prev) => [...prev, orderId])
    } else {
      setSelectedOrders((prev) => prev.filter((id) => id !== orderId))
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchOrders()
  }

  const openAssignDialog = (orderId?: string) => {
    setSelectedOrderForAssign(orderId || null)
    setAssignDialogOpen(true)
  }

  const getCustomerName = (order: Order) => {
    if (order.customerFirstName || order.customerLastName) {
      return `${order.customerFirstName || ""} ${order.customerLastName || ""}`.trim()
    }
    return order.customerEmail || "Unknown"
  }

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {userRole === "ADMIN" && selectedOrders.length > 0 && (
          <Button onClick={() => openAssignDialog()}>
            <UserPlus className="h-4 w-4 mr-2" />
            Assign ({selectedOrders.length})
          </Button>
        )}
      </div>

      {/* Table */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
          <div className="rounded-full bg-muted p-3 mb-3">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No orders found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search || status !== "all"
              ? "Try adjusting your filters"
              : "Sync your Shopify store to import orders"}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {userRole === "ADMIN" && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedOrders.length === orders.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Designer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  {userRole === "ADMIN" && (
                    <TableCell>
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOrder(order.id, checked as boolean)
                        }
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {order.name}
                    </Link>
                    {order.customerImages.length > 0 && (
                      <FileImage className="inline-block h-3 w-3 ml-1 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{getCustomerName(order)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[order.status] || "secondary"}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.designer ? (
                      <span className="text-sm">{order.designer.name}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {order.lineItems.reduce((sum, item) => sum + item.quantity, 0)} items
                    </span>
                  </TableCell>
                  <TableCell>
                    {order.totalPrice
                      ? formatCurrency(order.totalPrice, order.currency || "USD")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatRelativeTime(order.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/orders/${order.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {userRole === "ADMIN" && !order.designer && (
                          <DropdownMenuItem onClick={() => openAssignDialog(order.id)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign Designer
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} orders
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Assign Dialog */}
      <AssignDesignerDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        orderIds={selectedOrderForAssign ? [selectedOrderForAssign] : selectedOrders}
        onSuccess={() => {
          setSelectedOrders([])
          setSelectedOrderForAssign(null)
          fetchOrders()
        }}
      />
    </div>
  )
}
