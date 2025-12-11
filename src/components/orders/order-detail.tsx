"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDateTime, formatRelativeTime } from "@/lib/utils"
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileImage,
  Mail,
  MapPin,
  Phone,
  User,
  UserPlus,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Printer,
  Truck,
} from "lucide-react"
import { OrderTimeline } from "./order-timeline"
import { AssignDesignerDialog } from "./assign-designer-dialog"

interface Order {
  id: string
  shopifyId: string
  orderNumber: string
  name: string
  status: string
  financialStatus: string | null
  fulfillmentStatus: string | null
  totalPrice: any
  currency: string | null
  customerEmail: string | null
  customerPhone: string | null
  customerFirstName: string | null
  customerLastName: string | null
  shippingFirstName: string | null
  shippingLastName: string | null
  shippingAddress1: string | null
  shippingAddress2: string | null
  shippingCity: string | null
  shippingProvince: string | null
  shippingCountry: string | null
  shippingZip: string | null
  shippingPhone: string | null
  tags: string[]
  note: string | null
  createdAt: string
  designer: {
    id: string
    name: string
    email: string
  } | null
  lineItems: Array<{
    id: string
    title: string
    variantTitle: string | null
    sku: string | null
    quantity: number
    price: any
    properties: any
  }>
  customerImages: Array<{
    id: string
    filename: string
    originalUrl: string
  }>
  drafts: Array<{
    id: string
    version: number
    filename: string
    fileUrl: string
    status: string
    createdAt: string
    designer: {
      id: string
      name: string
    }
  }>
  timelineEvents: Array<{
    id: string
    action: string
    description: string
    createdAt: string
    user: {
      id: string
      name: string
    } | null
  }>
  store: {
    id: string
    name: string | null
    domain: string
  }
}

interface OrderDetailProps {
  order: Order
  userRole: string
  userId: string
}

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

export function OrderDetail({ order, userRole, userId }: OrderDetailProps) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  const getCustomerName = () => {
    if (order.customerFirstName || order.customerLastName) {
      return `${order.customerFirstName || ""} ${order.customerLastName || ""}`.trim()
    }
    return "Unknown Customer"
  }

  const getShippingAddress = () => {
    const parts = [
      order.shippingAddress1,
      order.shippingAddress2,
      order.shippingCity,
      order.shippingProvince,
      order.shippingZip,
      order.shippingCountry,
    ].filter(Boolean)

    return parts.join(", ")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/orders">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Order {order.name}</h1>
            <Badge variant={statusColors[order.status]}>
              {statusLabels[order.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground ml-10">
            Created {formatDateTime(order.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userRole === "ADMIN" && !order.designer && (
            <Button onClick={() => setAssignDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Designer
            </Button>
          )}
          <Button variant="outline" asChild>
            <a
              href={`https://${order.store.domain}/admin/orders/${order.shopifyId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View in Shopify
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Images */}
          {order.customerImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  Customer Uploaded Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {order.customerImages.map((image) => (
                    <div
                      key={image.id}
                      className="relative group rounded-lg overflow-hidden border"
                    >
                      <img
                        src={image.originalUrl}
                        alt={image.filename}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm" variant="secondary" asChild>
                          <a href={image.originalUrl} download target="_blank">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between py-3 border-b last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{item.title}</p>
                      {item.variantTitle && (
                        <p className="text-sm text-muted-foreground">
                          {item.variantTitle}
                        </p>
                      )}
                      {item.sku && (
                        <p className="text-xs text-muted-foreground">
                          SKU: {item.sku}
                        </p>
                      )}
                      {item.properties && Array.isArray(item.properties) && item.properties.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-2">
                          {item.properties.map((prop: any, idx: number) => (
                            <p key={idx}>
                              {prop.name}: {prop.value?.substring(0, 100)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(item.price, order.currency || "USD")} x{" "}
                        {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>
                    {formatCurrency(order.totalPrice, order.currency || "USD")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Drafts & Timeline */}
          <Tabs defaultValue="timeline">
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="drafts">
                Drafts ({order.drafts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <OrderTimeline events={order.timelineEvents} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="drafts" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {order.drafts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileImage className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No drafts uploaded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {order.drafts.map((draft) => (
                        <div
                          key={draft.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileImage className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{draft.filename}</p>
                              <p className="text-xs text-muted-foreground">
                                v{draft.version} • by {draft.designer.name} •{" "}
                                {formatRelativeTime(draft.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                draft.status === "APPROVED"
                                  ? "success"
                                  : draft.status === "REJECTED"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {draft.status}
                            </Badge>
                            <Button size="sm" variant="outline" asChild>
                              <a href={draft.fileUrl} download target="_blank">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{getCustomerName()}</p>
                </div>
              </div>

              {order.customerEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${order.customerEmail}`}
                    className="text-primary hover:underline"
                  >
                    {order.customerEmail}
                  </a>
                </div>
              )}

              {order.customerPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customerPhone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {order.shippingAddress1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    {order.shippingFirstName} {order.shippingLastName}
                    <br />
                    {order.shippingAddress1}
                    {order.shippingAddress2 && (
                      <>
                        <br />
                        {order.shippingAddress2}
                      </>
                    )}
                    <br />
                    {order.shippingCity}, {order.shippingProvince}{" "}
                    {order.shippingZip}
                    <br />
                    {order.shippingCountry}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Designer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assigned Designer</CardTitle>
            </CardHeader>
            <CardContent>
              {order.designer ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-medium">
                    {order.designer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{order.designer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.designer.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No designer assigned</p>
                  {userRole === "ADMIN" && (
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => setAssignDialogOpen(true)}
                    >
                      Assign Designer
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {order.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {order.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {order.note && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{order.note}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Assign Dialog */}
      <AssignDesignerDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        orderIds={[order.id]}
        onSuccess={() => window.location.reload()}
      />
    </div>
  )
}
