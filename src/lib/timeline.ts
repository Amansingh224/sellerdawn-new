import { db } from "@/lib/db"
import { TimelineAction } from "@prisma/client"
import { syncTimelineToShopify } from "@/lib/shopify/sync"

interface CreateTimelineEventParams {
  orderId: string
  userId?: string
  action: TimelineAction
  description: string
  metadata?: Record<string, any>
  syncToShopify?: boolean
}

export async function createTimelineEvent({
  orderId,
  userId,
  action,
  description,
  metadata,
  syncToShopify = true,
}: CreateTimelineEventParams) {
  // Create the event
  const event = await db.timelineEvent.create({
    data: {
      orderId,
      userId,
      action,
      description,
      metadata,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  // Sync to Shopify if requested
  if (syncToShopify) {
    try {
      const userName = event.user?.name
      await syncTimelineToShopify(orderId, description, userName || undefined)

      // Update the event to mark as synced
      await db.timelineEvent.update({
        where: { id: event.id },
        data: {
          syncedToShopify: true,
          shopifySyncedAt: new Date(),
        },
      })
    } catch (error) {
      console.error("Failed to sync timeline to Shopify:", error)
      // Don't throw - we still want to return the created event
    }
  }

  return event
}

// Helper functions for common timeline events
export async function logOrderImported(orderId: string, orderName: string) {
  return createTimelineEvent({
    orderId,
    action: TimelineAction.ORDER_IMPORTED,
    description: `Order ${orderName} imported from Shopify`,
    syncToShopify: false, // Don't sync import events
  })
}

export async function logDesignerAssigned(
  orderId: string,
  designerId: string,
  designerName: string,
  assignedByUserId: string
) {
  return createTimelineEvent({
    orderId,
    userId: assignedByUserId,
    action: TimelineAction.DESIGNER_ASSIGNED,
    description: `Designer ${designerName} assigned to order`,
    metadata: { designerId, designerName },
  })
}

export async function logDraftUploaded(
  orderId: string,
  userId: string,
  version: number,
  filename: string
) {
  return createTimelineEvent({
    orderId,
    userId,
    action: TimelineAction.DRAFT_UPLOADED,
    description: `Draft v${version} uploaded: ${filename}`,
    metadata: { version, filename },
  })
}

export async function logDraftSent(orderId: string, userId: string, version: number) {
  return createTimelineEvent({
    orderId,
    userId,
    action: TimelineAction.DRAFT_SENT,
    description: `Draft v${version} sent to customer for approval`,
    metadata: { version },
  })
}

export async function logDraftApproved(orderId: string, version: number) {
  return createTimelineEvent({
    orderId,
    action: TimelineAction.DRAFT_APPROVED,
    description: `Customer approved draft v${version}`,
    metadata: { version },
  })
}

export async function logDraftRejected(
  orderId: string,
  version: number,
  reason?: string
) {
  return createTimelineEvent({
    orderId,
    action: TimelineAction.DRAFT_REJECTED,
    description: `Customer rejected draft v${version}${reason ? `: ${reason}` : ""}`,
    metadata: { version, reason },
  })
}

export async function logDraftAutoApproved(orderId: string, version: number) {
  return createTimelineEvent({
    orderId,
    action: TimelineAction.DRAFT_AUTO_APPROVED,
    description: `Draft v${version} auto-approved after 48 hours`,
    metadata: { version },
  })
}

export async function logAddedToPrintQueue(orderId: string, userId: string) {
  return createTimelineEvent({
    orderId,
    userId,
    action: TimelineAction.ADDED_TO_PRINT_QUEUE,
    description: "Order added to print queue",
  })
}

export async function logPrintGroupCreated(
  orderId: string,
  userId: string,
  groupName: string
) {
  return createTimelineEvent({
    orderId,
    userId,
    action: TimelineAction.PRINT_GROUP_CREATED,
    description: `Added to print group: ${groupName}`,
    metadata: { groupName },
  })
}

export async function logQCCompleted(orderId: string, userId: string) {
  return createTimelineEvent({
    orderId,
    userId,
    action: TimelineAction.QC_COMPLETED,
    description: "Quality check completed",
  })
}

export async function logMarkedPrinted(orderId: string, userId: string) {
  return createTimelineEvent({
    orderId,
    userId,
    action: TimelineAction.MARKED_PRINTED,
    description: "Order marked as printed",
  })
}

export async function logTrackingAdded(
  orderId: string,
  userId: string,
  trackingNumber: string,
  carrier: string
) {
  return createTimelineEvent({
    orderId,
    userId,
    action: TimelineAction.TRACKING_ADDED,
    description: `Tracking added: ${trackingNumber} (${carrier})`,
    metadata: { trackingNumber, carrier },
  })
}

export async function logOrderFulfilled(orderId: string, userId?: string) {
  return createTimelineEvent({
    orderId,
    userId,
    action: TimelineAction.ORDER_FULFILLED,
    description: "Order fulfilled and synced to Shopify",
  })
}

export async function logNoteAdded(
  orderId: string,
  userId: string,
  note: string
) {
  return createTimelineEvent({
    orderId,
    userId,
    action: TimelineAction.NOTE_ADDED,
    description: note,
  })
}

export async function logStatusChanged(
  orderId: string,
  userId: string,
  fromStatus: string,
  toStatus: string
) {
  return createTimelineEvent({
    orderId,
    userId,
    action: TimelineAction.STATUS_CHANGED,
    description: `Status changed from ${fromStatus} to ${toStatus}`,
    metadata: { fromStatus, toStatus },
  })
}
