// Supabase Database Types for Seller Dawn
// This file provides TypeScript types for your database schema

export type UserRole = 'ADMIN' | 'DESIGNER' | 'PRINTER'
export type OrderStatus = 'IMPORTED' | 'ASSIGNED' | 'DRAFT_SENT' | 'DRAFT_APPROVED' | 'DRAFT_REJECTED' | 'PENDING_PRINT' | 'PRINTED' | 'FULFILLED'
export type DraftStatus = 'PENDING' | 'SENT' | 'APPROVED' | 'REJECTED'
export type TimelineAction =
  | 'ORDER_IMPORTED'
  | 'ORDER_UPDATED'
  | 'DESIGNER_ASSIGNED'
  | 'DRAFT_UPLOADED'
  | 'DRAFT_SENT'
  | 'DRAFT_APPROVED'
  | 'DRAFT_REJECTED'
  | 'DRAFT_AUTO_APPROVED'
  | 'ADDED_TO_PRINT_QUEUE'
  | 'PRINT_GROUP_CREATED'
  | 'QC_COMPLETED'
  | 'MARKED_PRINTED'
  | 'TRACKING_ADDED'
  | 'ORDER_FULFILLED'
  | 'NOTE_ADDED'
  | 'STATUS_CHANGED'
export type PrintGroupStatus = 'PENDING' | 'IN_PROGRESS' | 'QC_COMPLETED' | 'PRINTED'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth_id: string | null
          email: string
          name: string
          role: UserRole
          avatar: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_id?: string | null
          email: string
          name: string
          role?: UserRole
          avatar?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_id?: string | null
          email?: string
          name?: string
          role?: UserRole
          avatar?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      shopify_stores: {
        Row: {
          id: string
          domain: string
          access_token: string
          name: string | null
          email: string | null
          is_active: boolean
          last_sync_at: string | null
          webhook_secret: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          domain: string
          access_token: string
          name?: string | null
          email?: string | null
          is_active?: boolean
          last_sync_at?: string | null
          webhook_secret?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          domain?: string
          access_token?: string
          name?: string | null
          email?: string | null
          is_active?: boolean
          last_sync_at?: string | null
          webhook_secret?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          shopify_id: string
          order_number: string
          name: string
          financial_status: string | null
          fulfillment_status: string | null
          total_price: number | null
          currency: string | null
          customer_email: string | null
          customer_phone: string | null
          customer_first_name: string | null
          customer_last_name: string | null
          shipping_first_name: string | null
          shipping_last_name: string | null
          shipping_address1: string | null
          shipping_address2: string | null
          shipping_city: string | null
          shipping_province: string | null
          shipping_country: string | null
          shipping_zip: string | null
          shipping_phone: string | null
          tags: string[] | null
          note: string | null
          shopify_note: string | null
          shopify_created_at: string | null
          shopify_updated_at: string | null
          status: OrderStatus
          approval_token: string | null
          approval_sent_at: string | null
          approval_expires_at: string | null
          approved_at: string | null
          rejected_at: string | null
          rejection_reason: string | null
          tracking_number: string | null
          tracking_carrier: string | null
          fulfilled_at: string | null
          created_at: string
          updated_at: string
          store_id: string
          designer_id: string | null
          print_group_id: string | null
        }
        Insert: {
          id?: string
          shopify_id: string
          order_number: string
          name: string
          financial_status?: string | null
          fulfillment_status?: string | null
          total_price?: number | null
          currency?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          customer_first_name?: string | null
          customer_last_name?: string | null
          shipping_first_name?: string | null
          shipping_last_name?: string | null
          shipping_address1?: string | null
          shipping_address2?: string | null
          shipping_city?: string | null
          shipping_province?: string | null
          shipping_country?: string | null
          shipping_zip?: string | null
          shipping_phone?: string | null
          tags?: string[] | null
          note?: string | null
          shopify_note?: string | null
          shopify_created_at?: string | null
          shopify_updated_at?: string | null
          status?: OrderStatus
          approval_token?: string | null
          approval_sent_at?: string | null
          approval_expires_at?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          tracking_number?: string | null
          tracking_carrier?: string | null
          fulfilled_at?: string | null
          created_at?: string
          updated_at?: string
          store_id: string
          designer_id?: string | null
          print_group_id?: string | null
        }
        Update: {
          id?: string
          shopify_id?: string
          order_number?: string
          name?: string
          financial_status?: string | null
          fulfillment_status?: string | null
          total_price?: number | null
          currency?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          customer_first_name?: string | null
          customer_last_name?: string | null
          shipping_first_name?: string | null
          shipping_last_name?: string | null
          shipping_address1?: string | null
          shipping_address2?: string | null
          shipping_city?: string | null
          shipping_province?: string | null
          shipping_country?: string | null
          shipping_zip?: string | null
          shipping_phone?: string | null
          tags?: string[] | null
          note?: string | null
          shopify_note?: string | null
          shopify_created_at?: string | null
          shopify_updated_at?: string | null
          status?: OrderStatus
          approval_token?: string | null
          approval_sent_at?: string | null
          approval_expires_at?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          tracking_number?: string | null
          tracking_carrier?: string | null
          fulfilled_at?: string | null
          created_at?: string
          updated_at?: string
          store_id?: string
          designer_id?: string | null
          print_group_id?: string | null
        }
      }
      line_items: {
        Row: {
          id: string
          shopify_id: string
          title: string
          variant_title: string | null
          sku: string | null
          quantity: number
          price: number | null
          product_id: string | null
          variant_id: string | null
          properties: Record<string, any> | null
          created_at: string
          updated_at: string
          order_id: string
        }
        Insert: {
          id?: string
          shopify_id: string
          title: string
          variant_title?: string | null
          sku?: string | null
          quantity?: number
          price?: number | null
          product_id?: string | null
          variant_id?: string | null
          properties?: Record<string, any> | null
          created_at?: string
          updated_at?: string
          order_id: string
        }
        Update: {
          id?: string
          shopify_id?: string
          title?: string
          variant_title?: string | null
          sku?: string | null
          quantity?: number
          price?: number | null
          product_id?: string | null
          variant_id?: string | null
          properties?: Record<string, any> | null
          created_at?: string
          updated_at?: string
          order_id?: string
        }
      }
      customer_images: {
        Row: {
          id: string
          filename: string
          original_url: string
          stored_url: string | null
          file_size: number | null
          mime_type: string | null
          created_at: string
          updated_at: string
          order_id: string
        }
        Insert: {
          id?: string
          filename: string
          original_url: string
          stored_url?: string | null
          file_size?: number | null
          mime_type?: string | null
          created_at?: string
          updated_at?: string
          order_id: string
        }
        Update: {
          id?: string
          filename?: string
          original_url?: string
          stored_url?: string | null
          file_size?: number | null
          mime_type?: string | null
          created_at?: string
          updated_at?: string
          order_id?: string
        }
      }
      drafts: {
        Row: {
          id: string
          version: number
          filename: string
          file_url: string
          file_size: number | null
          status: DraftStatus
          rejection_note: string | null
          rejection_image: string | null
          sent_at: string | null
          responded_at: string | null
          created_at: string
          updated_at: string
          order_id: string
          designer_id: string
        }
        Insert: {
          id?: string
          version?: number
          filename: string
          file_url: string
          file_size?: number | null
          status?: DraftStatus
          rejection_note?: string | null
          rejection_image?: string | null
          sent_at?: string | null
          responded_at?: string | null
          created_at?: string
          updated_at?: string
          order_id: string
          designer_id: string
        }
        Update: {
          id?: string
          version?: number
          filename?: string
          file_url?: string
          file_size?: number | null
          status?: DraftStatus
          rejection_note?: string | null
          rejection_image?: string | null
          sent_at?: string | null
          responded_at?: string | null
          created_at?: string
          updated_at?: string
          order_id?: string
          designer_id?: string
        }
      }
      timeline_events: {
        Row: {
          id: string
          action: TimelineAction
          description: string
          metadata: Record<string, any> | null
          synced_to_shopify: boolean
          shopify_synced_at: string | null
          created_at: string
          order_id: string
          user_id: string | null
        }
        Insert: {
          id?: string
          action: TimelineAction
          description: string
          metadata?: Record<string, any> | null
          synced_to_shopify?: boolean
          shopify_synced_at?: string | null
          created_at?: string
          order_id: string
          user_id?: string | null
        }
        Update: {
          id?: string
          action?: TimelineAction
          description?: string
          metadata?: Record<string, any> | null
          synced_to_shopify?: boolean
          shopify_synced_at?: string | null
          created_at?: string
          order_id?: string
          user_id?: string | null
        }
      }
      print_groups: {
        Row: {
          id: string
          name: string
          status: PrintGroupStatus
          zip_url: string | null
          final_file_url: string | null
          qc_completed_at: string | null
          printed_at: string | null
          created_at: string
          updated_at: string
          printer_id: string | null
        }
        Insert: {
          id?: string
          name: string
          status?: PrintGroupStatus
          zip_url?: string | null
          final_file_url?: string | null
          qc_completed_at?: string | null
          printed_at?: string | null
          created_at?: string
          updated_at?: string
          printer_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          status?: PrintGroupStatus
          zip_url?: string | null
          final_file_url?: string | null
          qc_completed_at?: string | null
          printed_at?: string | null
          created_at?: string
          updated_at?: string
          printer_id?: string | null
        }
      }
    }
    Functions: {
      get_order_stats: {
        Args: Record<string, never>
        Returns: {
          total_orders: number
          pending_design: number
          awaiting_approval: number
          pending_print: number
          fulfilled: number
        }[]
      }
    }
  }
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type ShopifyStore = Database['public']['Tables']['shopify_stores']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type LineItem = Database['public']['Tables']['line_items']['Row']
export type CustomerImage = Database['public']['Tables']['customer_images']['Row']
export type Draft = Database['public']['Tables']['drafts']['Row']
export type TimelineEvent = Database['public']['Tables']['timeline_events']['Row']
export type PrintGroup = Database['public']['Tables']['print_groups']['Row']

// Extended types with relations
export type OrderWithRelations = Order & {
  line_items?: LineItem[]
  customer_images?: CustomerImage[]
  drafts?: Draft[]
  timeline_events?: TimelineEvent[]
  designer?: User
  store?: ShopifyStore
  print_group?: PrintGroup
}
