-- Seller Dawn - Supabase Schema
-- This schema replicates the Prisma schema for PostgreSQL/Supabase

-- ==================== ENUMS ====================

CREATE TYPE user_role AS ENUM ('ADMIN', 'DESIGNER', 'PRINTER');
CREATE TYPE order_status AS ENUM (
  'IMPORTED',
  'ASSIGNED',
  'DRAFT_SENT',
  'DRAFT_APPROVED',
  'DRAFT_REJECTED',
  'PENDING_PRINT',
  'PRINTED',
  'FULFILLED'
);
CREATE TYPE draft_status AS ENUM ('PENDING', 'SENT', 'APPROVED', 'REJECTED');
CREATE TYPE timeline_action AS ENUM (
  'ORDER_IMPORTED',
  'ORDER_UPDATED',
  'DESIGNER_ASSIGNED',
  'DRAFT_UPLOADED',
  'DRAFT_SENT',
  'DRAFT_APPROVED',
  'DRAFT_REJECTED',
  'DRAFT_AUTO_APPROVED',
  'ADDED_TO_PRINT_QUEUE',
  'PRINT_GROUP_CREATED',
  'QC_COMPLETED',
  'MARKED_PRINTED',
  'TRACKING_ADDED',
  'ORDER_FULFILLED',
  'NOTE_ADDED',
  'STATUS_CHANGED'
);
CREATE TYPE print_group_status AS ENUM ('PENDING', 'IN_PROGRESS', 'QC_COMPLETED', 'PRINTED');

-- ==================== USERS TABLE ====================
-- Note: Supabase Auth handles authentication, this table stores app-specific user data

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role DEFAULT 'DESIGNER',
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== SHOPIFY STORES ====================

CREATE TABLE shopify_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  name TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  webhook_secret TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== PRINT GROUPS ====================

CREATE TABLE print_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status print_group_status DEFAULT 'PENDING',
  zip_url TEXT,
  final_file_url TEXT,
  qc_completed_at TIMESTAMPTZ,
  printed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  printer_id UUID REFERENCES users(id)
);

-- ==================== ORDERS ====================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_id TEXT UNIQUE NOT NULL,
  order_number TEXT NOT NULL,
  name TEXT NOT NULL,

  -- Financial
  financial_status TEXT,
  fulfillment_status TEXT,
  total_price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',

  -- Customer Info
  customer_email TEXT,
  customer_phone TEXT,
  customer_first_name TEXT,
  customer_last_name TEXT,

  -- Shipping
  shipping_first_name TEXT,
  shipping_last_name TEXT,
  shipping_address1 TEXT,
  shipping_address2 TEXT,
  shipping_city TEXT,
  shipping_province TEXT,
  shipping_country TEXT,
  shipping_zip TEXT,
  shipping_phone TEXT,

  -- Metadata
  tags TEXT[],
  note TEXT,
  shopify_note TEXT,
  shopify_created_at TIMESTAMPTZ,
  shopify_updated_at TIMESTAMPTZ,

  -- Internal Status
  status order_status DEFAULT 'IMPORTED',

  -- Approval
  approval_token TEXT UNIQUE,
  approval_sent_at TIMESTAMPTZ,
  approval_expires_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Tracking
  tracking_number TEXT,
  tracking_carrier TEXT,
  fulfilled_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  store_id UUID NOT NULL REFERENCES shopify_stores(id),
  designer_id UUID REFERENCES users(id),
  print_group_id UUID REFERENCES print_groups(id)
);

-- ==================== LINE ITEMS ====================

CREATE TABLE line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_id TEXT UNIQUE NOT NULL,

  -- Product Info
  title TEXT NOT NULL,
  variant_title TEXT,
  sku TEXT,
  quantity INT DEFAULT 1,
  price DECIMAL(10, 2),

  -- Product Details
  product_id TEXT,
  variant_id TEXT,

  -- Properties (custom options)
  properties JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE
);

-- ==================== CUSTOMER IMAGES ====================

CREATE TABLE customer_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_url TEXT NOT NULL,
  stored_url TEXT,
  file_size INT,
  mime_type TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE
);

-- ==================== DRAFTS ====================

CREATE TABLE drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INT DEFAULT 1,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT,

  status draft_status DEFAULT 'PENDING',

  -- Rejection info
  rejection_note TEXT,
  rejection_image TEXT,

  -- Timestamps
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  designer_id UUID NOT NULL REFERENCES users(id)
);

-- ==================== TIMELINE EVENTS ====================

CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action timeline_action NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,

  -- Shopify sync
  synced_to_shopify BOOLEAN DEFAULT false,
  shopify_synced_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id)
);

-- ==================== INDEXES ====================

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_designer_id ON orders(designer_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_shopify_created_at ON orders(shopify_created_at);

CREATE INDEX idx_line_items_order_id ON line_items(order_id);
CREATE INDEX idx_customer_images_order_id ON customer_images(order_id);

CREATE INDEX idx_drafts_order_id ON drafts(order_id);
CREATE INDEX idx_drafts_designer_id ON drafts(designer_id);
CREATE INDEX idx_drafts_status ON drafts(status);

CREATE INDEX idx_timeline_events_order_id ON timeline_events(order_id);
CREATE INDEX idx_timeline_events_created_at ON timeline_events(created_at);

CREATE INDEX idx_print_groups_status ON print_groups(status);

-- ==================== ROW LEVEL SECURITY ====================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_groups ENABLE ROW LEVEL SECURITY;

-- ==================== RLS POLICIES ====================

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = auth_id);

-- Admins can read all users
CREATE POLICY "Admins can read all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Admins can update all users
CREATE POLICY "Admins can manage users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'ADMIN'
    )
  );

-- All authenticated users can read orders (will filter in app)
CREATE POLICY "Authenticated users can read orders" ON orders
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- All authenticated users can read stores
CREATE POLICY "Authenticated users can read stores" ON shopify_stores
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admins can manage stores
CREATE POLICY "Admins can manage stores" ON shopify_stores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'ADMIN'
    )
  );

-- All authenticated users can read line items
CREATE POLICY "Authenticated users can read line items" ON line_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- All authenticated users can read customer images
CREATE POLICY "Authenticated users can read customer images" ON customer_images
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Designers can manage their own drafts
CREATE POLICY "Designers can manage own drafts" ON drafts
  FOR ALL USING (
    designer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- All authenticated users can read drafts
CREATE POLICY "Authenticated users can read drafts" ON drafts
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- All authenticated users can read timeline
CREATE POLICY "Authenticated users can read timeline" ON timeline_events
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- All authenticated users can read print groups
CREATE POLICY "Authenticated users can read print groups" ON print_groups
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ==================== FUNCTIONS ====================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shopify_stores_updated_at
  BEFORE UPDATE ON shopify_stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_line_items_updated_at
  BEFORE UPDATE ON line_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_customer_images_updated_at
  BEFORE UPDATE ON customer_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_print_groups_updated_at
  BEFORE UPDATE ON print_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==================== HELPER FUNCTIONS ====================

-- Get order stats
CREATE OR REPLACE FUNCTION get_order_stats()
RETURNS TABLE (
  total_orders BIGINT,
  pending_design BIGINT,
  awaiting_approval BIGINT,
  pending_print BIGINT,
  fulfilled BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_orders,
    COUNT(*) FILTER (WHERE status IN ('IMPORTED', 'ASSIGNED'))::BIGINT as pending_design,
    COUNT(*) FILTER (WHERE status = 'DRAFT_SENT')::BIGINT as awaiting_approval,
    COUNT(*) FILTER (WHERE status IN ('DRAFT_APPROVED', 'PENDING_PRINT'))::BIGINT as pending_print,
    COUNT(*) FILTER (WHERE status = 'FULFILLED')::BIGINT as fulfilled
  FROM orders;
END;
$$ LANGUAGE plpgsql;

-- Create user profile after Supabase Auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (auth_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'DESIGNER')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
