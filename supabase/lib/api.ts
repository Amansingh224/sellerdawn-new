// API Helper Functions for Seller Dawn with Supabase
// Use these in your Lovable React components

import { supabase } from './supabase-client'
import type { Order, User, OrderWithRelations, OrderStatus, ShopifyStore } from './database.types'

// ==================== ORDERS ====================

export async function getOrders(options?: {
  status?: OrderStatus
  designerId?: string
  limit?: number
  offset?: number
}) {
  let query = supabase
    .from('orders')
    .select(`
      *,
      line_items (*),
      customer_images (*),
      designer:users!designer_id (*),
      store:shopify_stores!store_id (id, domain, name)
    `)
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.designerId) {
    query = query.eq('designer_id', options.designerId)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query
  if (error) throw error
  return data as OrderWithRelations[]
}

export async function getOrder(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      line_items (*),
      customer_images (*),
      drafts (*),
      timeline_events (*),
      designer:users!designer_id (*),
      store:shopify_stores!store_id (*)
    `)
    .eq('id', orderId)
    .single()

  if (error) throw error
  return data as OrderWithRelations
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) throw error

  // Add timeline event
  await supabase.from('timeline_events').insert({
    order_id: orderId,
    action: 'STATUS_CHANGED',
    description: `Order status changed to ${status}`,
    metadata: { new_status: status }
  })
}

export async function assignDesigner(orderId: string, designerId: string) {
  const { error } = await supabase
    .from('orders')
    .update({
      designer_id: designerId,
      status: 'ASSIGNED'
    })
    .eq('id', orderId)

  if (error) throw error

  // Get designer name for timeline
  const { data: designer } = await supabase
    .from('users')
    .select('name')
    .eq('id', designerId)
    .single()

  // Add timeline event
  await supabase.from('timeline_events').insert({
    order_id: orderId,
    action: 'DESIGNER_ASSIGNED',
    description: `Assigned to ${designer?.name || 'designer'}`,
    user_id: designerId,
    metadata: { designer_id: designerId }
  })
}

// ==================== STATS ====================

export async function getOrderStats() {
  const { data, error } = await supabase.rpc('get_order_stats')

  if (error) {
    // Fallback to manual count if function doesn't exist
    const { data: orders } = await supabase.from('orders').select('status')

    if (!orders) return { total: 0, pending: 0, awaiting: 0, printing: 0, fulfilled: 0 }

    return {
      total: orders.length,
      pending: orders.filter(o => ['IMPORTED', 'ASSIGNED'].includes(o.status)).length,
      awaiting: orders.filter(o => o.status === 'DRAFT_SENT').length,
      printing: orders.filter(o => ['DRAFT_APPROVED', 'PENDING_PRINT'].includes(o.status)).length,
      fulfilled: orders.filter(o => o.status === 'FULFILLED').length
    }
  }

  const stats = data[0]
  return {
    total: stats.total_orders,
    pending: stats.pending_design,
    awaiting: stats.awaiting_approval,
    printing: stats.pending_print,
    fulfilled: stats.fulfilled
  }
}

// ==================== USERS ====================

export async function getUsers(role?: string) {
  let query = supabase
    .from('users')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (role) {
    query = query.eq('role', role)
  }

  const { data, error } = await query
  if (error) throw error
  return data as User[]
}

export async function getDesigners() {
  return getUsers('DESIGNER')
}

export async function getPrinters() {
  return getUsers('PRINTER')
}

// ==================== STORES ====================

export async function getStores() {
  const { data, error } = await supabase
    .from('shopify_stores')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as ShopifyStore[]
}

export async function connectStore(domain: string, accessToken: string) {
  // First test the connection
  const testUrl = `https://${domain}/admin/api/2024-01/shop.json`
  const testResponse = await fetch(testUrl, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  })

  if (!testResponse.ok) {
    throw new Error('Invalid Shopify credentials')
  }

  const shopData = await testResponse.json()

  // Upsert store
  const { data, error } = await supabase
    .from('shopify_stores')
    .upsert({
      domain,
      access_token: accessToken,
      name: shopData.shop?.name,
      email: shopData.shop?.email,
      is_active: true
    }, { onConflict: 'domain' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function syncStore(storeId?: string) {
  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-sync`
  const params = storeId ? `?store_id=${storeId}` : ''

  const response = await fetch(`${functionUrl}${params}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Sync failed')
  }

  return response.json()
}

// ==================== DRAFTS ====================

export async function uploadDraft(
  orderId: string,
  designerId: string,
  file: File
) {
  // Upload file to Supabase Storage
  const filename = `${orderId}/${Date.now()}-${file.name}`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('drafts')
    .upload(filename, file)

  if (uploadError) throw uploadError

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('drafts')
    .getPublicUrl(filename)

  // Get current version
  const { data: drafts } = await supabase
    .from('drafts')
    .select('version')
    .eq('order_id', orderId)
    .order('version', { ascending: false })
    .limit(1)

  const version = (drafts?.[0]?.version || 0) + 1

  // Create draft record
  const { data, error } = await supabase
    .from('drafts')
    .insert({
      order_id: orderId,
      designer_id: designerId,
      filename: file.name,
      file_url: publicUrl,
      file_size: file.size,
      version
    })
    .select()
    .single()

  if (error) throw error

  // Add timeline event
  await supabase.from('timeline_events').insert({
    order_id: orderId,
    action: 'DRAFT_UPLOADED',
    description: `Draft v${version} uploaded`,
    user_id: designerId,
    metadata: { draft_id: data.id, version }
  })

  return data
}

export async function sendDraftForApproval(draftId: string, orderId: string) {
  // Generate approval token
  const approvalToken = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days to approve

  // Update draft status
  await supabase
    .from('drafts')
    .update({ status: 'SENT', sent_at: new Date().toISOString() })
    .eq('id', draftId)

  // Update order with approval info
  await supabase
    .from('orders')
    .update({
      status: 'DRAFT_SENT',
      approval_token: approvalToken,
      approval_sent_at: new Date().toISOString(),
      approval_expires_at: expiresAt.toISOString()
    })
    .eq('id', orderId)

  // Add timeline event
  await supabase.from('timeline_events').insert({
    order_id: orderId,
    action: 'DRAFT_SENT',
    description: 'Draft sent for customer approval',
    metadata: { draft_id: draftId, approval_token: approvalToken }
  })

  return { approvalToken, expiresAt }
}

// ==================== TIMELINE ====================

export async function getOrderTimeline(orderId: string) {
  const { data, error } = await supabase
    .from('timeline_events')
    .select(`
      *,
      user:users!user_id (id, name, avatar)
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function addNote(orderId: string, userId: string, note: string) {
  const { error } = await supabase.from('timeline_events').insert({
    order_id: orderId,
    action: 'NOTE_ADDED',
    description: note,
    user_id: userId
  })

  if (error) throw error
}

// ==================== APPROVAL (Public) ====================

export async function getOrderByApprovalToken(token: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      line_items (*),
      drafts (*)
    `)
    .eq('approval_token', token)
    .single()

  if (error) throw error

  // Check if expired
  if (data.approval_expires_at && new Date(data.approval_expires_at) < new Date()) {
    throw new Error('Approval link has expired')
  }

  return data
}

export async function approveDraft(orderId: string, token: string) {
  // Verify token
  const { data: order, error: verifyError } = await supabase
    .from('orders')
    .select('approval_token')
    .eq('id', orderId)
    .single()

  if (verifyError || order.approval_token !== token) {
    throw new Error('Invalid approval token')
  }

  // Update order
  await supabase
    .from('orders')
    .update({
      status: 'DRAFT_APPROVED',
      approved_at: new Date().toISOString()
    })
    .eq('id', orderId)

  // Update latest draft
  await supabase
    .from('drafts')
    .update({ status: 'APPROVED', responded_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .eq('status', 'SENT')

  // Add timeline
  await supabase.from('timeline_events').insert({
    order_id: orderId,
    action: 'DRAFT_APPROVED',
    description: 'Customer approved the draft'
  })
}

export async function rejectDraft(orderId: string, token: string, reason: string) {
  // Verify token
  const { data: order, error: verifyError } = await supabase
    .from('orders')
    .select('approval_token')
    .eq('id', orderId)
    .single()

  if (verifyError || order.approval_token !== token) {
    throw new Error('Invalid approval token')
  }

  // Update order
  await supabase
    .from('orders')
    .update({
      status: 'DRAFT_REJECTED',
      rejected_at: new Date().toISOString(),
      rejection_reason: reason
    })
    .eq('id', orderId)

  // Update latest draft
  await supabase
    .from('drafts')
    .update({
      status: 'REJECTED',
      rejection_note: reason,
      responded_at: new Date().toISOString()
    })
    .eq('order_id', orderId)
    .eq('status', 'SENT')

  // Add timeline
  await supabase.from('timeline_events').insert({
    order_id: orderId,
    action: 'DRAFT_REJECTED',
    description: `Customer rejected the draft: ${reason}`,
    metadata: { reason }
  })
}
