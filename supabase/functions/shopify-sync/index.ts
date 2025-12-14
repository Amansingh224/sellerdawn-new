// Supabase Edge Function for Shopify Order Sync
// Deploy with: supabase functions deploy shopify-sync
// Schedule with: Supabase Dashboard > Edge Functions > Cron

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShopifyOrder {
  id: number
  order_number: number
  name: string
  email: string
  phone: string | null
  financial_status: string
  fulfillment_status: string | null
  total_price: string
  currency: string
  created_at: string
  updated_at: string
  note: string | null
  tags: string
  customer: {
    id: number
    email: string
    first_name: string
    last_name: string
    phone: string | null
  }
  shipping_address?: {
    first_name: string
    last_name: string
    address1: string
    address2: string | null
    city: string
    province: string
    country: string
    zip: string
    phone: string | null
  }
  line_items: Array<{
    id: number
    title: string
    variant_title: string | null
    sku: string | null
    quantity: number
    price: string
    product_id: number
    variant_id: number
    properties: Array<{ name: string; value: string }>
  }>
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get store ID from query params (optional)
    const url = new URL(req.url)
    const storeId = url.searchParams.get('store_id')

    // Find active stores
    let query = supabase
      .from('shopify_stores')
      .select('*')
      .eq('is_active', true)

    if (storeId) {
      query = query.eq('id', storeId)
    }

    const { data: stores, error: storeError } = await query

    if (storeError) {
      throw new Error(`Failed to fetch stores: ${storeError.message}`)
    }

    if (!stores || stores.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No active stores found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = []

    for (const store of stores) {
      const syncResult = await syncStoreOrders(supabase, store)
      results.push({
        store: store.domain,
        ...syncResult
      })

      // Update last sync timestamp
      await supabase
        .from('shopify_stores')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', store.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function syncStoreOrders(supabase: any, store: any) {
  let imported = 0
  let updated = 0
  let errors: string[] = []

  try {
    // Fetch recent orders from Shopify (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const shopifyUrl = `https://${store.domain}/admin/api/2024-01/orders.json?status=any&limit=250&created_at_min=${thirtyDaysAgo.toISOString()}`

    const response = await fetch(shopifyUrl, {
      headers: {
        'X-Shopify-Access-Token': store.access_token,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Shopify API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const orders: ShopifyOrder[] = data.orders || []

    console.log(`Found ${orders.length} orders from ${store.domain}`)

    for (const shopifyOrder of orders) {
      try {
        // Check if order exists
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('shopify_id', shopifyOrder.id.toString())
          .single()

        // Extract customer images from line item properties
        const customerImages: string[] = []
        for (const item of shopifyOrder.line_items) {
          for (const prop of item.properties || []) {
            if (prop.value && typeof prop.value === 'string' &&
                (prop.value.includes('cdn.shopify.com') ||
                 prop.value.includes('http') && (prop.value.includes('.jpg') || prop.value.includes('.png') || prop.value.includes('.jpeg')))) {
              customerImages.push(prop.value)
            }
          }
        }

        const orderData = {
          shopify_id: shopifyOrder.id.toString(),
          order_number: shopifyOrder.order_number.toString(),
          name: shopifyOrder.name,
          financial_status: shopifyOrder.financial_status,
          fulfillment_status: shopifyOrder.fulfillment_status,
          total_price: parseFloat(shopifyOrder.total_price),
          currency: shopifyOrder.currency,
          customer_email: shopifyOrder.email || shopifyOrder.customer?.email,
          customer_phone: shopifyOrder.phone || shopifyOrder.customer?.phone,
          customer_first_name: shopifyOrder.customer?.first_name,
          customer_last_name: shopifyOrder.customer?.last_name,
          shipping_first_name: shopifyOrder.shipping_address?.first_name,
          shipping_last_name: shopifyOrder.shipping_address?.last_name,
          shipping_address1: shopifyOrder.shipping_address?.address1,
          shipping_address2: shopifyOrder.shipping_address?.address2,
          shipping_city: shopifyOrder.shipping_address?.city,
          shipping_province: shopifyOrder.shipping_address?.province,
          shipping_country: shopifyOrder.shipping_address?.country,
          shipping_zip: shopifyOrder.shipping_address?.zip,
          shipping_phone: shopifyOrder.shipping_address?.phone,
          tags: shopifyOrder.tags ? shopifyOrder.tags.split(',').map(t => t.trim()) : [],
          shopify_note: shopifyOrder.note,
          shopify_created_at: shopifyOrder.created_at,
          shopify_updated_at: shopifyOrder.updated_at,
          store_id: store.id,
        }

        let orderId: string

        if (existingOrder) {
          // Update existing order
          const { error: updateError } = await supabase
            .from('orders')
            .update(orderData)
            .eq('id', existingOrder.id)

          if (updateError) throw updateError
          orderId = existingOrder.id
          updated++
        } else {
          // Insert new order
          const { data: newOrder, error: insertError } = await supabase
            .from('orders')
            .insert(orderData)
            .select('id')
            .single()

          if (insertError) throw insertError
          orderId = newOrder.id
          imported++

          // Create timeline event for new order
          await supabase.from('timeline_events').insert({
            order_id: orderId,
            action: 'ORDER_IMPORTED',
            description: `Order ${shopifyOrder.name} imported from Shopify`,
            metadata: { shopify_order_id: shopifyOrder.id }
          })
        }

        // Sync line items
        for (const item of shopifyOrder.line_items) {
          const lineItemData = {
            shopify_id: item.id.toString(),
            order_id: orderId,
            title: item.title,
            variant_title: item.variant_title,
            sku: item.sku,
            quantity: item.quantity,
            price: parseFloat(item.price),
            product_id: item.product_id?.toString(),
            variant_id: item.variant_id?.toString(),
            properties: item.properties,
          }

          await supabase
            .from('line_items')
            .upsert(lineItemData, { onConflict: 'shopify_id' })
        }

        // Sync customer images
        for (const imageUrl of customerImages) {
          const filename = imageUrl.split('/').pop() || 'image'

          const { data: existingImage } = await supabase
            .from('customer_images')
            .select('id')
            .eq('order_id', orderId)
            .eq('original_url', imageUrl)
            .single()

          if (!existingImage) {
            await supabase.from('customer_images').insert({
              order_id: orderId,
              filename,
              original_url: imageUrl,
            })
          }
        }
      } catch (orderError: any) {
        console.error(`Error processing order ${shopifyOrder.id}:`, orderError)
        errors.push(`Order ${shopifyOrder.name}: ${orderError.message}`)
      }
    }

    return { imported, updated, errors: errors.length > 0 ? errors : undefined }
  } catch (error: any) {
    return { imported, updated, error: error.message }
  }
}
