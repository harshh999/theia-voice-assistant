# Café Menu Management System - API Documentation

## Overview

This system provides a clean, systematic backend for managing café menus with proper relationships, performance optimization, and security.

## Database Schema

### Tables

#### 1. `cafes`
- **Primary Key**: `id` (UUID)
- **Unique Fields**: `slug`
- **Required Fields**: `name`, `slug`
- **Optional Fields**: `logo_url`, `location`, `timings`
- **System Fields**: `is_active`, `created_at`, `updated_at`

#### 2. `categories`
- **Primary Key**: `id` (UUID)
- **Foreign Key**: `cafe_id` → `cafes.id` (CASCADE DELETE)
- **Required Fields**: `name`, `order_index`
- **Unique Constraint**: `(cafe_id, name)`
- **System Fields**: `is_active`, `created_at`, `updated_at`

#### 3. `menu_items`
- **Primary Key**: `id` (UUID)
- **Foreign Key**: `category_id` → `categories.id` (CASCADE DELETE)
- **Required Fields**: `name`, `price`, `order_index`
- **Optional Fields**: `description`
- **Unique Constraint**: `(category_id, name)`
- **System Fields**: `is_available`, `is_active`, `created_at`, `updated_at`

### Relationships

```
cafes (1) → (many) categories (1) → (many) menu_items
```

## Views

### 1. `full_cafe_menu` (Tabular View)
Flattened view of all menu data for reporting and analysis.

**Columns:**
- `cafe_id`, `cafe_name`, `cafe_slug`, `logo_url`, `location`, `timings`
- `category_id`, `category_name`, `category_order`
- `item_id`, `item_name`, `item_description`, `item_price`, `item_order`
- `*_active`, `*_available` flags
- `*_created_at` timestamps

### 2. `cafe_menu_json` (Nested JSON View)
Structured JSON view optimized for frontend consumption.

**Structure:**
```json
{
  "cafe_id": "uuid",
  "cafe_name": "string",
  "cafe_slug": "string",
  "logo_url": "string",
  "location": "string", 
  "timings": "string",
  "created_at": "timestamp",
  "categories": [
    {
      "category_id": "uuid",
      "category_name": "string",
      "order_index": 0,
      "items": [
        {
          "item_id": "uuid",
          "item_name": "string",
          "description": "string",
          "price": 250.00,
          "order_index": 0,
          "is_available": true
        }
      ]
    }
  ]
}
```

## Functions

### 1. `get_cafe_menu_by_slug(cafe_slug TEXT)`
Returns complete menu JSON for a specific café.

**Usage:**
```sql
SELECT get_cafe_menu_by_slug('demo-cafe');
```

### 2. `search_cafes(search_term TEXT)`
Fuzzy search for cafés by name with similarity scoring.

**Returns:**
- `cafe_id`, `cafe_name`, `cafe_slug`, `similarity_score`

**Usage:**
```sql
SELECT * FROM search_cafes('coffee');
```

## API Endpoints (via Supabase)

### Basic CRUD Operations

#### Cafés

```javascript
// Get all cafés
const { data } = await supabase
  .from('cafes')
  .select('*')
  .eq('is_active', true)
  .order('name')

// Get café by slug
const { data } = await supabase
  .from('cafes')
  .select('*')
  .eq('slug', 'demo-cafe')
  .single()

// Create café
const { data } = await supabase
  .from('cafes')
  .insert({
    name: 'New Café',
    slug: 'new-cafe',
    location: '123 Main St',
    timings: '9 AM - 10 PM'
  })
  .select()
```

#### Categories

```javascript
// Get categories for a café
const { data } = await supabase
  .from('categories')
  .select('*')
  .eq('cafe_id', cafeId)
  .eq('is_active', true)
  .order('order_index')

// Create category
const { data } = await supabase
  .from('categories')
  .insert({
    cafe_id: cafeId,
    name: 'Beverages',
    order_index: 0
  })
  .select()
```

#### Menu Items

```javascript
// Get items for a category
const { data } = await supabase
  .from('menu_items')
  .select('*')
  .eq('category_id', categoryId)
  .eq('is_active', true)
  .order('order_index')

// Create menu item
const { data } = await supabase
  .from('menu_items')
  .insert({
    category_id: categoryId,
    name: 'Espresso',
    description: 'Rich coffee shot',
    price: 120.00,
    order_index: 0
  })
  .select()
```

### Advanced Queries

#### Complete Menu Data

```javascript
// Using the JSON view (recommended)
const { data } = await supabase
  .from('cafe_menu_json')
  .select('menu_data')
  .eq('slug', 'demo-cafe')
  .single()

// Using the PostgreSQL function
const { data } = await supabase
  .rpc('get_cafe_menu_by_slug', {
    cafe_slug: 'demo-cafe'
  })

// Using manual joins (for custom requirements)
const { data } = await supabase
  .from('cafes')
  .select(`
    *,
    categories (
      *,
      menu_items (*)
    )
  `)
  .eq('slug', 'demo-cafe')
  .single()
```

#### Search Operations

```javascript
// Search cafés
const { data } = await supabase
  .rpc('search_cafes', {
    search_term: 'coffee'
  })

// Filter by price range
const { data } = await supabase
  .from('full_cafe_menu')
  .select('*')
  .gte('item_price', 100)
  .lte('item_price', 300)
  .eq('item_available', true)
```

## Performance Optimizations

### Indexes
- **Primary lookups**: `cafes.slug`, `categories.cafe_id`, `menu_items.category_id`
- **Ordering**: Composite indexes on `(cafe_id, order_index)`
- **Search**: GIN indexes for fuzzy text search
- **Filtering**: Indexes on active/available flags

### Query Optimization Tips

1. **Use Views**: Prefer `cafe_menu_json` for complete menu data
2. **Filter Early**: Always include `is_active = true` in WHERE clauses
3. **Limit Results**: Use `LIMIT` for pagination
4. **Select Specific Columns**: Avoid `SELECT *` in production

## Security (RLS Policies)

### Public Access
- **Read**: All active cafés, categories, and menu items
- **Search**: Café search functionality

### Admin Access
- **Full CRUD**: All operations on all tables
- **File Upload**: Logo management in storage

### Implementation

```sql
-- Public read access
CREATE POLICY "Public read access" ON cafes
  FOR SELECT USING (is_active = true);

-- Admin full access  
CREATE POLICY "Admin full access" ON cafes
  FOR ALL USING (true) WITH CHECK (true);
```

## Error Handling

### Common Errors

1. **Duplicate Slug**: `UNIQUE constraint violation`
2. **Invalid Price**: `CHECK constraint violation (price > 0)`
3. **Missing References**: `FOREIGN KEY constraint violation`
4. **Empty Names**: `CHECK constraint violation (length > 0)`

### Best Practices

```javascript
try {
  const { data, error } = await supabase
    .from('cafes')
    .insert(cafeData)
    .select()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Café name already exists')
    }
    throw new Error(error.message)
  }

  return { success: true, data }
} catch (error) {
  return { success: false, error: error.message }
}
```

## Maintenance Operations

### Soft Deletes
```javascript
// Deactivate instead of deleting
await supabase
  .from('cafes')
  .update({ is_active: false })
  .eq('id', cafeId)
```

### Reordering
```javascript
// Update order indexes
await supabase
  .from('categories')
  .update({ order_index: newIndex })
  .eq('id', categoryId)
```

### Bulk Operations
```javascript
// Batch insert menu items
await supabase
  .from('menu_items')
  .insert(menuItemsArray)
```

## Monitoring Queries

### Performance Monitoring
```sql
-- Check index usage
SELECT * FROM pg_stat_user_indexes 
WHERE tablename IN ('cafes', 'categories', 'menu_items');

-- Table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass))
FROM pg_tables 
WHERE tablename IN ('cafes', 'categories', 'menu_items');
```

### Data Validation
```sql
-- Check for orphaned records
SELECT * FROM categories c 
LEFT JOIN cafes cf ON c.cafe_id = cf.id 
WHERE cf.id IS NULL;

-- Check constraint violations
SELECT * FROM menu_items WHERE price <= 0;
```

## Migration Strategy

### Adding New Fields
```sql
-- Add new column with default
ALTER TABLE cafes ADD COLUMN phone VARCHAR(20);

-- Update existing records if needed
UPDATE cafes SET phone = 'N/A' WHERE phone IS NULL;
```

### Schema Changes
1. **Backup**: Always backup before schema changes
2. **Test**: Run migrations on staging first
3. **Rollback Plan**: Have rollback scripts ready
4. **Monitor**: Check performance after changes

## Integration Examples

### Next.js Service Layer
```javascript
export class MenuService {
  static async getCafeMenu(slug) {
    const { data } = await supabase
      .from('cafe_menu_json')
      .select('menu_data')
      .eq('slug', slug)
      .single()
    
    return data?.menu_data
  }
}
```

### React Component
```jsx
function MenuDisplay({ cafeSlug }) {
  const [menu, setMenu] = useState(null)
  
  useEffect(() => {
    MenuService.getCafeMenu(cafeSlug)
      .then(setMenu)
  }, [cafeSlug])
  
  return (
    <div>
      <h1>{menu?.cafe_name}</h1>
      {menu?.categories.map(category => (
        <CategorySection key={category.category_id} {...category} />
      ))}
    </div>
  )
}
```