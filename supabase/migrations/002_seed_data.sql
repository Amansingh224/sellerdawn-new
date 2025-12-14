-- Seed Data for Seller Dawn
-- Run this after creating your first user via Supabase Auth signup

-- Make the first user an admin (replace with your actual email)
-- UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';

-- Add your Shopify store (replace with your actual credentials)
-- INSERT INTO shopify_stores (domain, access_token, name, is_active)
-- VALUES ('pet-on-canvas.myshopify.com', 'shpat_your_token_here', 'POC Gifts', true);

-- Sample test data (for development/demo purposes)
-- Uncomment to use

/*
-- Create test users (only for development - use Auth signup in production)
INSERT INTO users (email, name, role, is_active) VALUES
  ('admin@sellerdawn.com', 'Admin User', 'ADMIN', true),
  ('designer1@sellerdawn.com', 'Sarah Designer', 'DESIGNER', true),
  ('designer2@sellerdawn.com', 'John Artist', 'DESIGNER', true),
  ('printer@sellerdawn.com', 'Print Team', 'PRINTER', true);

-- Create a demo store
INSERT INTO shopify_stores (id, domain, access_token, name, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo-store.myshopify.com',
  'demo_token',
  'Demo Store',
  true
);

-- Create sample orders
INSERT INTO orders (
  shopify_id, order_number, name, status,
  customer_email, customer_first_name, customer_last_name,
  total_price, currency, store_id
) VALUES
  ('demo-1001', '1001', '#1001', 'IMPORTED',
   'john@example.com', 'John', 'Smith', 49.99, 'USD',
   '00000000-0000-0000-0000-000000000001'),
  ('demo-1002', '1002', '#1002', 'ASSIGNED',
   'jane@example.com', 'Jane', 'Doe', 79.99, 'USD',
   '00000000-0000-0000-0000-000000000001'),
  ('demo-1003', '1003', '#1003', 'DRAFT_SENT',
   'bob@example.com', 'Bob', 'Wilson', 59.99, 'USD',
   '00000000-0000-0000-0000-000000000001');
*/
