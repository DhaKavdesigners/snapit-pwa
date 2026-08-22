-- ============================================================================
-- SNAPIT KGF — UNIFIED PRODUCTION SUPABASE DATABASE SCHEMA
-- ============================================================================

-- 1. DROP DRAFT TABLES
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.merchants CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. CREATE PROFILES TABLE (Customer Accounts)
CREATE TABLE public.profiles (
    id TEXT PRIMARY KEY, -- Customer phone (e.g. '9845012345')
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT,
    address_line2 TEXT,
    landmark TEXT,
    pincode TEXT,
    delivery_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE STORES TABLE
CREATE TABLE public.stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    category TEXT NOT NULL,
    is_online BOOLEAN NOT NULL DEFAULT false,
    rush_mode BOOLEAN NOT NULL DEFAULT false,
    rating NUMERIC(2,1) DEFAULT 4.8,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE MERCHANTS TABLE
CREATE TABLE public.merchants (
    id TEXT PRIMARY KEY,
    uid TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'MERCHANT_OWNER',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE PRODUCTS TABLE
CREATE TABLE public.products (
    id TEXT PRIMARY KEY,
    store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price INTEGER NOT NULL, -- in paise (e.g. 2800 = ₹28)
    image_url TEXT,
    category TEXT NOT NULL,
    delivery_eta_minutes INTEGER DEFAULT 10,
    in_stock BOOLEAN NOT NULL DEFAULT true,
    stock_count INTEGER NOT NULL DEFAULT 100,
    availability TEXT NOT NULL DEFAULT 'AVAILABLE',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE ORDERS TABLE
CREATE TABLE public.orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT DEFAULT 'guest_user',
    store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
    rider_id TEXT,
    status TEXT NOT NULL DEFAULT 'PLACED',
    items JSONB NOT NULL,
    estimated_total INTEGER NOT NULL,
    delivery_address JSONB NOT NULL,
    cooking_instructions TEXT,
    idempotency_key TEXT,
    payment_method TEXT DEFAULT 'UPI_NOW',
    payment_status TEXT DEFAULT 'PAID',
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    prep_time_minutes INTEGER,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ENABLE REALTIME BROADCASTING
ALTER TABLE public.stores REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.stores, public.products, public.orders, public.profiles;
COMMIT;

-- 8. INSERT INITIAL DATA (Mhetha Stores & Nandhini KGF)

-- Stores
INSERT INTO public.stores (id, name, logo_url, category, is_online, rush_mode)
VALUES 
    ('s1', 'Mhetha Stores', 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80', 'GROCERY', true, false),
    ('s4', 'Nandhini KGF', 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=300&auto=format&fit=crop&q=80', 'DAIRY', true, false);

-- Merchant Logins
INSERT INTO public.merchants (id, uid, password, store_id, name, phone, role)
VALUES 
    ('m_mhetha', 'm_mhetha', 'mhetha123', 's1', 'Ramesh Mhetha', '+91 98450 11223', 'MERCHANT_OWNER'),
    ('m_nandhini', 'm_nandhini', 'nandhini123', 's4', 'Suresh Kumar', '+91 94480 33445', 'MERCHANT_OWNER');

-- Products for Mhetha Stores (s1)
INSERT INTO public.products (id, store_id, name, price, image_url, category, delivery_eta_minutes, in_stock, stock_count, availability, description)
VALUES 
    ('ms01', 's1', 'Maggi 2-Minute Noodles (Pack of 2)', 2800, 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80', 'Noodles & Snacks', 10, true, 120, 'AVAILABLE', '140 g Pack of 2 instant masala noodles'),
    ('ms02', 's1', 'Fortune Sunflower Oil (1L Pouch)', 13500, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80', 'Edible Oils', 10, true, 40, 'AVAILABLE', '1 Litre refined sunflower pouch'),
    ('ms03', 's1', 'Tata Tea Gold (250g)', 4500, 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&auto=format&fit=crop&q=80', 'Tea & Coffee', 10, true, 65, 'AVAILABLE', '250 g rich & aromatic tea blend'),
    ('ms04', 's1', 'Aashirvaad Shudh Chakki Atta (5kg)', 24500, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80', 'Atta & Flours', 10, true, 30, 'AVAILABLE', '100% whole wheat grain flour with natural dietary fiber'),
    ('ms05', 's1', 'Surf Excel Easy Wash (1kg)', 13000, 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&auto=format&fit=crop&q=80', 'Soaps & Detergents', 10, true, 50, 'AVAILABLE', 'Advanced stain removal washing powder');

-- Products for Nandhini KGF (s4)
INSERT INTO public.products (id, store_id, name, price, image_url, category, delivery_eta_minutes, in_stock, stock_count, availability, description)
VALUES 
    ('nd01', 's4', 'Nandini Pasteurised Toned Milk (500ml)', 2400, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80', 'Milk & Curd', 8, true, 80, 'AVAILABLE', 'Fresh pasteurised toned milk with 3.0% fat'),
    ('nd02', 's4', 'Nandini Special Curd (500g)', 2600, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&auto=format&fit=crop&q=80', 'Milk & Curd', 8, true, 45, 'AVAILABLE', 'Thick & delicious pure pasteurised curd pouch'),
    ('nd03', 's4', 'Nandini Pure Cow Ghee (500ml Pouch)', 32000, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80', 'Butter & Ghee', 8, true, 25, 'AVAILABLE', 'Traditional aroma pure cow milk ghee'),
    ('nd04', 's4', 'Nandini Fresh Paneer (200g)', 9500, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=80', 'Paneer & Cheese', 8, true, 35, 'AVAILABLE', 'Soft and creamy malai paneer block for cooking'),
    ('nd05', 's4', 'Nandini Pasteurized Table Butter (100g)', 5600, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop&q=80', 'Butter & Ghee', 8, true, 40, 'AVAILABLE', 'Delicious salted table butter block');

-- 9. OPEN ROW LEVEL SECURITY (RLS) POLICIES FOR DEVELOPMENT
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow All Stores" ON public.stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Merchants" ON public.merchants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
