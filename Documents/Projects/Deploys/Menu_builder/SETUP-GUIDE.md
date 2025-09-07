# Digital Menu Generator - Complete Setup Guide

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- Git (for version control)

### 2. Project Setup

```bash
# Clone and install
git clone <your-repo>
cd digital-menu-generator
npm install

# Copy environment template
cp .env.local.example .env.local
```

### 3. Supabase Configuration

#### A. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Choose region and database password
4. Wait for project to initialize (~2 minutes)

#### B. Get Credentials
1. Go to **Settings** → **API**
2. Copy your **Project URL** and **anon/public key**
3. Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### C. Run Database Schema
1. Go to **SQL Editor** in Supabase dashboard
2. Copy entire content from `database/schema.sql`
3. Click **Run** to execute
4. Verify tables are created in **Table Editor**

### 4. Start Development

```bash
npm run dev
```

Visit `http://localhost:3000/admin` to test the connection.

## 📊 Database Schema Overview

### Core Tables
```
cafes
├── id (UUID, Primary Key)
├── name (VARCHAR, Required)
├── slug (VARCHAR, Unique, Required)
├── logo_url (TEXT, Optional)
├── location (TEXT, Optional)
├── timings (TEXT, Optional)
├── is_active (BOOLEAN, Default: true)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

categories
├── id (UUID, Primary Key)
├── cafe_id (UUID, Foreign Key → cafes.id)
├── name (VARCHAR, Required)
├── order_index (INTEGER, Required)
├── is_active (BOOLEAN, Default: true)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

menu_items
├── id (UUID, Primary Key)
├── category_id (UUID, Foreign Key → categories.id)
├── name (VARCHAR, Required)
├── description (TEXT, Optional)
├── price (DECIMAL, Required, > 0)
├── order_index (INTEGER, Required)
├── is_available (BOOLEAN, Default: true)
├── is_active (BOOLEAN, Default: true)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Optimized Views
- **`full_cafe_menu`**: Flattened view for reporting
- **`cafe_menu_json`**: Nested JSON structure for frontend

### Utility Functions
- **`get_cafe_menu_by_slug(slug)`**: Get complete menu JSON
- **`search_cafes(term)`**: Fuzzy search with similarity scoring

## 🔧 System Features

### 1. Admin Panel (`/admin`)
- ✅ Create cafés with logo upload
- ✅ Add unlimited categories and menu items
- ✅ Real-time validation and error handling
- ✅ Database connection testing
- ✅ QR code generation

### 2. Menu Display (`/{cafe-slug}.lazlle.studio`)
- ✅ Mobile-first responsive design
- ✅ Expandable/collapsible categories
- ✅ Proper data hierarchy (café → categories → items)
- ✅ Price formatting with currency
- ✅ Logo and café information display

### 3. Backend Architecture
- ✅ Proper foreign key relationships with CASCADE DELETE
- ✅ Performance indexes for fast queries
- ✅ Row Level Security (RLS) policies
- ✅ Automated timestamp updates
- ✅ Data validation constraints
- ✅ Soft delete functionality

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect GitHub repo to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically

3. **Custom Domain Setup**
   - Add `lazlle.studio` as custom domain
   - Add `*.lazlle.studio` as wildcard domain
   - Configure DNS:
     ```
     A     lazlle.studio          → 76.76.19.61 (Vercel IP)
     CNAME *.lazlle.studio        → cname.vercel-dns.com
     ```

### Environment Variables (Production)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 📝 Usage Examples

### Creating Your First Café

1. **Visit Admin Panel**: `http://localhost:3000/admin`
2. **Fill Café Details**:
   - Name: "Demo Café"
   - Location: "123 Main Street"
   - Timings: "9:00 AM - 10:00 PM"
   - Logo: Upload image (optional)

3. **Add Categories**:
   - "Beverages"
   - "Main Course"
   - "Desserts"

4. **Add Menu Items**:
   ```
   Beverages:
   - Espresso (₹120) - "Rich and bold coffee shot"
   - Cappuccino (₹180) - "Espresso with steamed milk foam"
   
   Main Course:
   - Pasta Carbonara (₹350) - "Creamy pasta with bacon"
   - Chicken Biryani (₹280) - "Aromatic basmati rice with spices"
   ```

5. **Generate Menu**: Click "Generate Digital Menu"
6. **Get QR Code**: Download and print the QR code
7. **Access Menu**: Visit `demo-cafe.lazlle.studio`

### API Usage Examples

```javascript
// Get complete menu
const menu = await MenuService.getCafeMenuBySlug('demo-cafe')

// Search cafés
const results = await MenuService.searchCafes('coffee')

// Get café statistics
const stats = await MenuService.getCafeStats('demo-cafe')

// Update item availability
await MenuService.updateItemAvailability(itemId, false)
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "Database connection failed"
- ✅ Check `.env.local` has correct Supabase credentials
- ✅ Verify Supabase project is active
- ✅ Ensure no typos in URL/key

#### 2. "Database tables missing"
- ✅ Run complete `database/schema.sql` in Supabase SQL Editor
- ✅ Check **Table Editor** shows all tables
- ✅ Verify RLS policies are enabled

#### 3. "Menu not found"
- ✅ Check café slug is correct (lowercase, no spaces)
- ✅ Verify café `is_active = true`
- ✅ Ensure categories and items exist

#### 4. "Logo upload failed"
- ✅ Check Supabase Storage bucket `cafe-logos` exists
- ✅ Verify storage policies allow uploads
- ✅ Ensure file size < 50MB

### Debug Commands

```sql
-- Check if schema is complete
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cafes', 'categories', 'menu_items');

-- Check sample data
SELECT * FROM cafes WHERE slug = 'demo-cafe';

-- Test views
SELECT * FROM cafe_menu_json LIMIT 1;

-- Test functions
SELECT get_cafe_menu_by_slug('demo-cafe');
```

## 📈 Performance Optimization

### Database Indexes
The schema includes optimized indexes for:
- ✅ Slug lookups (`cafes.slug`)
- ✅ Hierarchical queries (`categories.cafe_id`, `menu_items.category_id`)
- ✅ Ordering (`order_index` fields)
- ✅ Text search (GIN indexes for fuzzy matching)
- ✅ Filtering (`is_active`, `is_available` flags)

### Query Optimization
- ✅ Use `cafe_menu_json` view for complete menu data
- ✅ Filter by `is_active = true` early in queries
- ✅ Leverage composite indexes for sorting
- ✅ Use `LIMIT` for pagination

### Caching Strategy
```javascript
// Client-side caching
const [menuCache, setMenuCache] = useState(new Map())

const getCachedMenu = async (slug) => {
  if (menuCache.has(slug)) {
    return menuCache.get(slug)
  }
  
  const menu = await MenuService.getCafeMenuBySlug(slug)
  menuCache.set(slug, menu)
  return menu
}
```

## 🔒 Security Best Practices

### Row Level Security (RLS)
- ✅ Public read access to active records only
- ✅ Admin full access for management
- ✅ Automatic policy enforcement

### Data Validation
- ✅ Required field constraints
- ✅ Unique constraints (slugs, names per café)
- ✅ Check constraints (positive prices)
- ✅ Foreign key integrity

### Input Sanitization
```javascript
// Slug generation
const slug = slugify(cafeName, {
  lower: true,
  strict: true,
  remove: /[*+~.()'"!:@]/g
})

// Price validation
const price = Math.max(0, parseFloat(priceInput) || 0)
```

## 📚 Additional Resources

### Sample Queries
See `database/sample-queries.sql` for comprehensive examples.

### API Documentation
See `database/API-DOCUMENTATION.md` for detailed API reference.

### Schema Reference
See `database/schema.sql` for complete database setup.

## 🆘 Support

### Getting Help
1. Check this setup guide first
2. Review error messages in browser console
3. Test database connection in admin panel
4. Verify Supabase dashboard for data

### Common SQL Queries
```sql
-- Reset sample data
DELETE FROM menu_items WHERE category_id IN (
  SELECT id FROM categories WHERE cafe_id IN (
    SELECT id FROM cafes WHERE slug = 'demo-cafe'
  )
);

-- Check system health
SELECT 
  (SELECT COUNT(*) FROM cafes WHERE is_active = true) as active_cafes,
  (SELECT COUNT(*) FROM categories WHERE is_active = true) as active_categories,
  (SELECT COUNT(*) FROM menu_items WHERE is_active = true) as active_items;
```

---

## ✅ Checklist

Before going live, ensure:

- [ ] Supabase project created and configured
- [ ] Complete schema.sql executed successfully
- [ ] Environment variables set correctly
- [ ] Admin panel loads and shows green connection status
- [ ] Sample café created successfully
- [ ] Menu page displays correctly
- [ ] QR code generates properly
- [ ] Custom domain configured (for production)
- [ ] SSL certificate active
- [ ] Performance tested with sample data

Your Digital Menu Generator is now ready! 🎉