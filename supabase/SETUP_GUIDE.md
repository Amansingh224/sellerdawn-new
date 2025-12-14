# Seller Dawn - Lovable + Supabase Setup Guide

This guide will help you set up Seller Dawn on Lovable with Supabase as the backend.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: seller-dawn
   - **Database Password**: (save this, you'll need it)
   - **Region**: Choose closest to your users
5. Click "Create new project" and wait for setup

## Step 2: Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `migrations/001_initial_schema.sql`
4. Paste into the editor
5. Click "Run" to execute

This creates all tables, indexes, RLS policies, and helper functions.

## Step 3: Configure Authentication

1. Go to **Authentication** > **Providers**
2. Make sure **Email** is enabled
3. Go to **URL Configuration**
4. Add your Lovable app URL to "Redirect URLs"

## Step 4: Create Storage Bucket

1. Go to **Storage**
2. Click "New bucket"
3. Create a bucket named `drafts`
4. Set it to **Public** (for sharing draft images with customers)

## Step 5: Get API Keys

1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`
   - **service_role key**: (for Edge Functions only)

## Step 6: Create Lovable Project

1. Go to [lovable.dev](https://lovable.dev) and create a new project
2. Name it "Seller Dawn"
3. In project settings, add environment variables:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```

## Step 7: Add Supabase Client

Install dependencies in Lovable:
```bash
npm install @supabase/supabase-js
```

Copy these files to your Lovable project:
- `lib/supabase-client.ts`
- `lib/database.types.ts`
- `lib/api.ts`

## Step 8: Deploy Edge Function (for Shopify Sync)

### Option A: Using Supabase CLI (Recommended)

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy function
supabase functions deploy shopify-sync
```

### Option B: Using Supabase Dashboard

1. Go to **Edge Functions**
2. Click "New function"
3. Name it `shopify-sync`
4. Paste the code from `functions/shopify-sync/index.ts`

## Step 9: Set Up Cron Job for Auto-Sync

1. Go to **Edge Functions** > **shopify-sync**
2. Click "Add Schedule"
3. Enter cron expression: `*/5 * * * *` (every 5 minutes)
4. Save

## Step 10: Connect Your Shopify Store

Use the `connectStore` function in your app:

```typescript
import { connectStore, syncStore } from './lib/api'

// Connect store
await connectStore('pet-on-canvas.myshopify.com', 'shpat_your_token')

// Sync orders
await syncStore()
```

Or call directly via Supabase:
```sql
INSERT INTO shopify_stores (domain, access_token, name, is_active)
VALUES ('pet-on-canvas.myshopify.com', 'shpat_your_token', 'POC Gifts', true);
```

## Step 11: Create Admin User

After signing up your first user, make them an admin:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

---

## Example React Components for Lovable

### Login Page

```tsx
import { useState } from 'react'
import { signIn } from './lib/supabase-client'
import { useNavigate } from 'react-router-dom'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Login</button>
    </form>
  )
}
```

### Dashboard Stats

```tsx
import { useEffect, useState } from 'react'
import { getOrderStats } from './lib/api'

export function DashboardStats() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    awaiting: 0,
    printing: 0,
    fulfilled: 0
  })

  useEffect(() => {
    getOrderStats().then(setStats)
  }, [])

  return (
    <div className="grid grid-cols-5 gap-4">
      <StatCard title="Total Orders" value={stats.total} />
      <StatCard title="Pending Design" value={stats.pending} />
      <StatCard title="Awaiting Approval" value={stats.awaiting} />
      <StatCard title="Pending Print" value={stats.printing} />
      <StatCard title="Fulfilled" value={stats.fulfilled} />
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm text-gray-500">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
```

### Orders List

```tsx
import { useEffect, useState } from 'react'
import { getOrders } from './lib/api'
import type { OrderWithRelations } from './lib/database.types'

export function OrdersList() {
  const [orders, setOrders] = useState<OrderWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrders({ limit: 20 })
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}

function OrderCard({ order }: { order: OrderWithRelations }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between">
        <h3 className="font-bold">{order.name}</h3>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
          {order.status}
        </span>
      </div>
      <p className="text-gray-500">
        {order.customer_first_name} {order.customer_last_name}
      </p>
      <p className="text-gray-500">{order.customer_email}</p>
      <div className="mt-2">
        {order.line_items?.map(item => (
          <div key={item.id} className="text-sm">
            {item.quantity}x {item.title}
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Your Shopify Store Credentials

**Domain**: `pet-on-canvas.myshopify.com`
**Store Name**: POC Gifts

You'll need to provide your Shopify Admin API Access Token when connecting the store.

---

## Troubleshooting

### "No rows returned" error
Make sure you've run the database migration and created at least one user.

### Sync not working
1. Check Edge Function logs in Supabase Dashboard
2. Verify your Shopify access token is valid
3. Make sure the store is marked as `is_active = true`

### RLS blocking queries
The Row Level Security policies require authentication. Make sure you're signed in before making queries.

### Storage upload fails
1. Check the `drafts` bucket exists
2. Verify it's set to public
3. Check file size limits in Supabase settings

---

## Architecture Overview

```
Lovable (Frontend)
    |
    v
Supabase Client (JS SDK)
    |
    +---> Supabase Auth (Login/Signup)
    |
    +---> Supabase Database (PostgreSQL)
    |
    +---> Supabase Storage (Drafts/Images)
    |
    +---> Supabase Edge Functions
              |
              v
         Shopify API (Order Sync)
```

The Edge Function runs on a cron schedule to automatically sync orders from Shopify. All data is stored in the PostgreSQL database with Row Level Security ensuring users can only access what they're authorized to see.
