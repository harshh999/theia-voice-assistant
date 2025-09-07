-- =====================================================
-- SAMPLE QUERIES FOR CAFÉ MENU SYSTEM
-- =====================================================

-- =====================================================
-- 1. BASIC CAFÉ QUERIES
-- =====================================================

-- Get all active cafes
SELECT id, name, slug, location, timings, created_at 
FROM cafes 
WHERE is_active = true 
ORDER BY name;

-- Get cafe by slug
SELECT * FROM cafes WHERE slug = 'demo-cafe' AND is_active = true;

-- Search cafes by name (fuzzy search)
SELECT * FROM search_cafes('demo');

-- =====================================================
-- 2. COMPLETE MENU QUERIES
-- =====================================================

-- Get complete menu for a cafe (using view)
SELECT * FROM full_cafe_menu WHERE cafe_slug = 'demo-cafe';

-- Get structured JSON menu for a cafe
SELECT menu_data FROM cafe_menu_json WHERE slug = 'demo-cafe';

-- Using the utility function
SELECT get_cafe_menu_by_slug('demo-cafe');

-- =====================================================
-- 3. HIERARCHICAL QUERIES WITH JOINS
-- =====================================================

-- Get cafe with categories and items (manual join)
SELECT 
    c.name as cafe_name,
    c.slug as cafe_slug,
    c.logo_url,
    c.location,
    c.timings,
    cat.name as category_name,
    cat.order_index as category_order,
    mi.name as item_name,
    mi.description,
    mi.price,
    mi.order_index as item_order,
    mi.is_available
FROM cafes c
LEFT JOIN categories cat ON c.id = cat.cafe_id AND cat.is_active = true
LEFT JOIN menu_items mi ON cat.id = mi.category_id AND mi.is_active = true
WHERE c.slug = 'demo-cafe' AND c.is_active = true
ORDER BY cat.order_index, mi.order_index;

-- Get only available items for a cafe
SELECT 
    c.name as cafe_name,
    cat.name as category_name,
    mi.name as item_name,
    mi.price,
    mi.description
FROM cafes c
JOIN categories cat ON c.id = cat.cafe_id
JOIN menu_items mi ON cat.id = mi.category_id
WHERE c.slug = 'demo-cafe' 
  AND c.is_active = true 
  AND cat.is_active = true 
  AND mi.is_active = true 
  AND mi.is_available = true
ORDER BY cat.order_index, mi.order_index;

-- =====================================================
-- 4. AGGREGATION QUERIES
-- =====================================================

-- Count items per category for a cafe
SELECT 
    c.name as cafe_name,
    cat.name as category_name,
    COUNT(mi.id) as item_count,
    AVG(mi.price) as avg_price,
    MIN(mi.price) as min_price,
    MAX(mi.price) as max_price
FROM cafes c
JOIN categories cat ON c.id = cat.cafe_id
LEFT JOIN menu_items mi ON cat.id = mi.category_id AND mi.is_active = true
WHERE c.slug = 'demo-cafe' AND c.is_active = true AND cat.is_active = true
GROUP BY c.id, c.name, cat.id, cat.name, cat.order_index
ORDER BY cat.order_index;

-- Get cafe statistics
SELECT 
    c.name as cafe_name,
    COUNT(DISTINCT cat.id) as total_categories,
    COUNT(mi.id) as total_items,
    COUNT(CASE WHEN mi.is_available THEN 1 END) as available_items,
    AVG(mi.price) as avg_item_price,
    MIN(mi.price) as cheapest_item,
    MAX(mi.price) as most_expensive_item
FROM cafes c
LEFT JOIN categories cat ON c.id = cat.cafe_id AND cat.is_active = true
LEFT JOIN menu_items mi ON cat.id = mi.category_id AND mi.is_active = true
WHERE c.slug = 'demo-cafe' AND c.is_active = true
GROUP BY c.id, c.name;

-- =====================================================
-- 5. ADMIN QUERIES (CRUD OPERATIONS)
-- =====================================================

-- Create a new cafe
INSERT INTO cafes (name, slug, location, timings)
VALUES ('New Café', 'new-cafe', '456 Oak Street', '8:00 AM - 11:00 PM')
RETURNING id, name, slug;

-- Add category to cafe
INSERT INTO categories (cafe_id, name, order_index)
SELECT id, 'Main Course', 2
FROM cafes 
WHERE slug = 'demo-cafe'
RETURNING id, name;

-- Add menu item to category
INSERT INTO menu_items (category_id, name, description, price, order_index)
SELECT cat.id, 'Pasta Carbonara', 'Creamy pasta with bacon and parmesan', 350.00, 0
FROM categories cat
JOIN cafes c ON cat.cafe_id = c.id
WHERE c.slug = 'demo-cafe' AND cat.name = 'Main Course'
RETURNING id, name, price;

-- Update item price
UPDATE menu_items 
SET price = 380.00, updated_at = NOW()
WHERE name = 'Pasta Carbonara' 
  AND category_id IN (
    SELECT cat.id 
    FROM categories cat 
    JOIN cafes c ON cat.cafe_id = c.id 
    WHERE c.slug = 'demo-cafe'
  );

-- Soft delete (deactivate) an item
UPDATE menu_items 
SET is_active = false, updated_at = NOW()
WHERE name = 'Pasta Carbonara'
  AND category_id IN (
    SELECT cat.id 
    FROM categories cat 
    JOIN cafes c ON cat.cafe_id = c.id 
    WHERE c.slug = 'demo-cafe'
  );

-- Mark item as unavailable (temporarily)
UPDATE menu_items 
SET is_available = false, updated_at = NOW()
WHERE name = 'Croissant'
  AND category_id IN (
    SELECT cat.id 
    FROM categories cat 
    JOIN cafes c ON cat.cafe_id = c.id 
    WHERE c.slug = 'demo-cafe'
  );

-- =====================================================
-- 6. REORDERING QUERIES
-- =====================================================

-- Reorder categories (swap positions)
UPDATE categories 
SET order_index = CASE 
    WHEN order_index = 0 THEN 1
    WHEN order_index = 1 THEN 0
    ELSE order_index
END,
updated_at = NOW()
WHERE cafe_id = (SELECT id FROM cafes WHERE slug = 'demo-cafe')
  AND order_index IN (0, 1);

-- Reorder menu items within a category
UPDATE menu_items 
SET order_index = CASE 
    WHEN name = 'Espresso' THEN 2
    WHEN name = 'Cappuccino' THEN 0  
    WHEN name = 'Latte' THEN 1
    ELSE order_index
END,
updated_at = NOW()
WHERE category_id = (
    SELECT cat.id 
    FROM categories cat 
    JOIN cafes c ON cat.cafe_id = c.id 
    WHERE c.slug = 'demo-cafe' AND cat.name = 'Beverages'
);

-- =====================================================
-- 7. SEARCH AND FILTER QUERIES
-- =====================================================

-- Search items by name across all cafes
SELECT 
    c.name as cafe_name,
    c.slug as cafe_slug,
    cat.name as category_name,
    mi.name as item_name,
    mi.price,
    mi.description
FROM menu_items mi
JOIN categories cat ON mi.category_id = cat.id
JOIN cafes c ON cat.cafe_id = c.id
WHERE mi.name ILIKE '%coffee%' 
  AND mi.is_active = true 
  AND cat.is_active = true 
  AND c.is_active = true
ORDER BY c.name, mi.name;

-- Find items in price range
SELECT 
    c.name as cafe_name,
    cat.name as category_name,
    mi.name as item_name,
    mi.price
FROM menu_items mi
JOIN categories cat ON mi.category_id = cat.id
JOIN cafes c ON cat.cafe_id = c.id
WHERE mi.price BETWEEN 100 AND 200
  AND mi.is_active = true 
  AND mi.is_available = true
  AND cat.is_active = true 
  AND c.is_active = true
ORDER BY mi.price, c.name;

-- =====================================================
-- 8. PERFORMANCE MONITORING QUERIES
-- =====================================================

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('cafes', 'categories', 'menu_items')
ORDER BY tablename, indexname;

-- Table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('cafes', 'categories', 'menu_items')
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- =====================================================
-- 9. DATA VALIDATION QUERIES
-- =====================================================

-- Check for orphaned categories (shouldn't exist with CASCADE)
SELECT cat.* 
FROM categories cat 
LEFT JOIN cafes c ON cat.cafe_id = c.id 
WHERE c.id IS NULL;

-- Check for orphaned menu items (shouldn't exist with CASCADE)
SELECT mi.* 
FROM menu_items mi 
LEFT JOIN categories cat ON mi.category_id = cat.id 
WHERE cat.id IS NULL;

-- Check for duplicate slugs (shouldn't exist with UNIQUE constraint)
SELECT slug, COUNT(*) 
FROM cafes 
GROUP BY slug 
HAVING COUNT(*) > 1;

-- Check for negative prices (shouldn't exist with CHECK constraint)
SELECT * FROM menu_items WHERE price <= 0;

-- =====================================================
-- 10. BACKUP AND MAINTENANCE QUERIES
-- =====================================================

-- Export cafe data as JSON
SELECT json_agg(
    json_build_object(
        'cafe', row_to_json(c),
        'menu', (SELECT menu_data FROM cafe_menu_json WHERE id = c.id)
    )
) as full_export
FROM cafes c 
WHERE c.is_active = true;

-- Get recently updated items
SELECT 
    c.name as cafe_name,
    cat.name as category_name,
    mi.name as item_name,
    mi.updated_at
FROM menu_items mi
JOIN categories cat ON mi.category_id = cat.id
JOIN cafes c ON cat.cafe_id = c.id
WHERE mi.updated_at > NOW() - INTERVAL '7 days'
ORDER BY mi.updated_at DESC;