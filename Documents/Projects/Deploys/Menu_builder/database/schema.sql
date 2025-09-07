-- =====================================================
-- DIGITAL MENU GENERATOR - COMPLETE DATABASE SCHEMA
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For better text search performance

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Cafes table - Main entity
CREATE TABLE cafes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL CHECK (length(trim(name)) > 0),
    slug VARCHAR(255) UNIQUE NOT NULL CHECK (length(trim(slug)) > 0 AND slug ~ '^[a-z0-9-]+$'),
    logo_url TEXT,
    location TEXT,
    timings TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table - Menu sections
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL CHECK (length(trim(name)) > 0),
    order_index INTEGER NOT NULL DEFAULT 0 CHECK (order_index >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique category names per cafe
    UNIQUE(cafe_id, name)
);

-- Menu Items table - Individual food/drink items
CREATE TABLE menu_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL CHECK (length(trim(name)) > 0),
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    order_index INTEGER NOT NULL DEFAULT 0 CHECK (order_index >= 0),
    is_available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique item names per category
    UNIQUE(category_id, name)
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Primary lookup indexes
CREATE INDEX idx_cafes_slug ON cafes(slug) WHERE is_active = true;
CREATE INDEX idx_cafes_name_trgm ON cafes USING gin(name gin_trgm_ops) WHERE is_active = true;

-- Category indexes
CREATE INDEX idx_categories_cafe_id ON categories(cafe_id) WHERE is_active = true;
CREATE INDEX idx_categories_order ON categories(cafe_id, order_index) WHERE is_active = true;
CREATE INDEX idx_categories_name ON categories(cafe_id, name) WHERE is_active = true;

-- Menu item indexes
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id) WHERE is_active = true;
CREATE INDEX idx_menu_items_order ON menu_items(category_id, order_index) WHERE is_active = true;
CREATE INDEX idx_menu_items_available ON menu_items(category_id, is_available) WHERE is_active = true;
CREATE INDEX idx_menu_items_name_trgm ON menu_items USING gin(name gin_trgm_ops) WHERE is_active = true;

-- Composite index for full menu queries
CREATE INDEX idx_full_menu_lookup ON categories(cafe_id, order_index) 
    INCLUDE (id, name) WHERE is_active = true;

-- =====================================================
-- AUTOMATED TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_cafes_updated_at BEFORE UPDATE ON cafes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR EASY QUERYING
-- =====================================================

-- Tabular view: All menu data flattened for reporting
CREATE VIEW full_cafe_menu AS
SELECT 
    c.id as cafe_id,
    c.name as cafe_name,
    c.slug as cafe_slug,
    c.logo_url,
    c.location,
    c.timings,
    c.is_active as cafe_active,
    
    cat.id as category_id,
    cat.name as category_name,
    cat.order_index as category_order,
    cat.is_active as category_active,
    
    mi.id as item_id,
    mi.name as item_name,
    mi.description as item_description,
    mi.price as item_price,
    mi.order_index as item_order,
    mi.is_available as item_available,
    mi.is_active as item_active,
    
    c.created_at as cafe_created_at,
    cat.created_at as category_created_at,
    mi.created_at as item_created_at
FROM cafes c
LEFT JOIN categories cat ON c.id = cat.cafe_id AND cat.is_active = true
LEFT JOIN menu_items mi ON cat.id = mi.category_id AND mi.is_active = true
WHERE c.is_active = true
ORDER BY c.name, cat.order_index, mi.order_index;

-- JSON view: Nested structure for frontend consumption
CREATE VIEW cafe_menu_json AS
SELECT 
    c.id,
    c.slug,
    json_build_object(
        'cafe_id', c.id,
        'cafe_name', c.name,
        'cafe_slug', c.slug,
        'logo_url', c.logo_url,
        'location', c.location,
        'timings', c.timings,
        'created_at', c.created_at,
        'categories', COALESCE(
            json_agg(
                json_build_object(
                    'category_id', cat.id,
                    'category_name', cat.name,
                    'order_index', cat.order_index,
                    'items', cat.items
                ) ORDER BY cat.order_index
            ) FILTER (WHERE cat.id IS NOT NULL),
            '[]'::json
        )
    ) as menu_data
FROM cafes c
LEFT JOIN (
    SELECT 
        cat.id,
        cat.cafe_id,
        cat.name,
        cat.order_index,
        COALESCE(
            json_agg(
                json_build_object(
                    'item_id', mi.id,
                    'item_name', mi.name,
                    'description', mi.description,
                    'price', mi.price,
                    'order_index', mi.order_index,
                    'is_available', mi.is_available
                ) ORDER BY mi.order_index
            ) FILTER (WHERE mi.id IS NOT NULL),
            '[]'::json
        ) as items
    FROM categories cat
    LEFT JOIN menu_items mi ON cat.id = mi.category_id AND mi.is_active = true
    WHERE cat.is_active = true
    GROUP BY cat.id, cat.cafe_id, cat.name, cat.order_index
) cat ON c.id = cat.cafe_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.slug, c.logo_url, c.location, c.timings, c.created_at;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get complete menu by slug
CREATE OR REPLACE FUNCTION get_cafe_menu_by_slug(cafe_slug TEXT)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT menu_data 
        FROM cafe_menu_json 
        WHERE slug = cafe_slug
    );
END;
$$ LANGUAGE plpgsql;

-- Function to search cafes by name
CREATE OR REPLACE FUNCTION search_cafes(search_term TEXT)
RETURNS TABLE(
    cafe_id UUID,
    cafe_name VARCHAR(255),
    cafe_slug VARCHAR(255),
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.slug,
        similarity(c.name, search_term) as score
    FROM cafes c
    WHERE c.is_active = true
      AND (c.name ILIKE '%' || search_term || '%' OR similarity(c.name, search_term) > 0.3)
    ORDER BY score DESC, c.name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read access on active cafes" ON cafes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access on active categories" ON categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access on active menu items" ON menu_items
    FOR SELECT USING (is_active = true);

-- Admin access policies (for the admin panel)
CREATE POLICY "Admin full access on cafes" ON cafes
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on categories" ON categories
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on menu items" ON menu_items
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- STORAGE SETUP FOR LOGOS
-- =====================================================

-- Create storage bucket for cafe logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cafe-logos', 'cafe-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read access to cafe logos" ON storage.objects
    FOR SELECT USING (bucket_id = 'cafe-logos');

CREATE POLICY "Admin upload access to cafe logos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'cafe-logos');

CREATE POLICY "Admin update access to cafe logos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'cafe-logos');

CREATE POLICY "Admin delete access to cafe logos" ON storage.objects
    FOR DELETE USING (bucket_id = 'cafe-logos');

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample cafe
INSERT INTO cafes (name, slug, location, timings) 
VALUES ('Demo Café', 'demo-cafe', '123 Main Street, City', '9:00 AM - 10:00 PM')
ON CONFLICT (slug) DO NOTHING;

-- Get the cafe ID for sample data
DO $$
DECLARE
    demo_cafe_id UUID;
    beverages_id UUID;
    snacks_id UUID;
BEGIN
    SELECT id INTO demo_cafe_id FROM cafes WHERE slug = 'demo-cafe';
    
    IF demo_cafe_id IS NOT NULL THEN
        -- Insert sample categories
        INSERT INTO categories (cafe_id, name, order_index) 
        VALUES 
            (demo_cafe_id, 'Beverages', 0),
            (demo_cafe_id, 'Snacks', 1)
        ON CONFLICT (cafe_id, name) DO NOTHING;
        
        -- Get category IDs
        SELECT id INTO beverages_id FROM categories WHERE cafe_id = demo_cafe_id AND name = 'Beverages';
        SELECT id INTO snacks_id FROM categories WHERE cafe_id = demo_cafe_id AND name = 'Snacks';
        
        -- Insert sample menu items
        IF beverages_id IS NOT NULL THEN
            INSERT INTO menu_items (category_id, name, description, price, order_index)
            VALUES 
                (beverages_id, 'Espresso', 'Rich and bold coffee shot', 120.00, 0),
                (beverages_id, 'Cappuccino', 'Espresso with steamed milk foam', 180.00, 1),
                (beverages_id, 'Latte', 'Smooth espresso with steamed milk', 200.00, 2)
            ON CONFLICT (category_id, name) DO NOTHING;
        END IF;
        
        IF snacks_id IS NOT NULL THEN
            INSERT INTO menu_items (category_id, name, description, price, order_index)
            VALUES 
                (snacks_id, 'Croissant', 'Buttery, flaky pastry', 150.00, 0),
                (snacks_id, 'Sandwich', 'Fresh ingredients on artisan bread', 250.00, 1)
            ON CONFLICT (category_id, name) DO NOTHING;
        END IF;
    END IF;
END $$;