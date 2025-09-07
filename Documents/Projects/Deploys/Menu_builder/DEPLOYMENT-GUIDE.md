# 🚀 Wildcard Subdomain Deployment Guide

## 📋 Overview

Your Next.js app now supports wildcard subdomains for `lazlle.studio`:
- `lazlle.studio` → Admin panel
- `karibu.lazlle.studio` → Karibu café menu
- `demo-cafe.lazlle.studio` → Demo café menu

## 🔧 What's Been Added

### **1. Middleware (`middleware.ts`)**
- ✅ Detects subdomains from host header
- ✅ Root domain serves admin panel
- ✅ Subdomains rewrite to `/[cafe]` route
- ✅ Handles both production and Vercel preview URLs

### **2. Dynamic Route (`app/[cafe]/page.tsx`)**
- ✅ Queries `cafe_menu_json` view by slug
- ✅ Mobile-first responsive design
- ✅ Expandable categories
- ✅ Error handling for missing cafés
- ✅ Loading states and animations

### **3. Updated Configuration**
- ✅ `next.config.js` optimized for subdomains
- ✅ `vercel.json` for deployment settings
- ✅ Image domains configured

## 🌐 Vercel Deployment Steps

### **Step 1: Deploy to Vercel**

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add wildcard subdomain support"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Deploy with default settings

3. **Add Environment Variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### **Step 2: Configure Domain**

1. **Add Domain in Vercel**:
   - Go to Project Settings → Domains
   - Add `lazlle.studio`
   - Add `*.lazlle.studio` (wildcard)

2. **Configure DNS**:
   ```dns
   # A Record
   lazlle.studio → 76.76.19.61

   # CNAME Record  
   *.lazlle.studio → cname.vercel-dns.com
   ```

3. **Verify SSL**:
   - Vercel automatically provisions SSL certificates
   - Wait for DNS propagation (~24 hours max)

## 🧪 Testing

### **Local Testing**

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Test URLs**:
   - `http://localhost:3000` → Admin panel
   - `http://localhost:3000/admin` → Admin panel
   - `http://localhost:3000/demo-cafe` → Demo café menu

### **Production Testing**

1. **Root domain**:
   - `https://lazlle.studio` → Admin panel
   - `https://www.lazlle.studio` → Admin panel

2. **Subdomains**:
   - `https://demo-cafe.lazlle.studio` → Demo café menu
   - `https://karibu.lazlle.studio` → Karibu café menu
   - `https://nonexistent.lazlle.studio` → "Café not found"

## 📱 Mobile Experience

### **Features**
- ✅ **Sticky header** with café info
- ✅ **Expandable categories** (all expanded by default)
- ✅ **Touch-friendly** tap targets
- ✅ **Fast loading** with optimized queries
- ✅ **Offline-ready** error states

### **Performance**
- ✅ **Server-side rendering** for fast initial load
- ✅ **Optimized images** with Next.js Image component
- ✅ **Minimal JavaScript** for fast interactions
- ✅ **Progressive enhancement** for better UX

## 🔍 Troubleshooting

### **Common Issues**

#### **1. Subdomain not working**
- ✅ Check DNS propagation: `dig *.lazlle.studio`
- ✅ Verify Vercel domain configuration
- ✅ Ensure middleware is deployed

#### **2. "Café not found" error**
- ✅ Check café slug in database matches subdomain
- ✅ Verify `is_active = true` in cafes table
- ✅ Test query in Supabase SQL editor

#### **3. Middleware not triggering**
- ✅ Check `middleware.ts` is in project root
- ✅ Verify matcher configuration
- ✅ Test with different subdomains

### **Debug Commands**

```sql
-- Check if café exists
SELECT * FROM cafe_menu_json WHERE slug = 'demo-cafe';

-- Test view directly
SELECT menu_data FROM cafe_menu_json LIMIT 1;

-- Check active cafés
SELECT slug, name FROM cafes WHERE is_active = true;
```

## 📊 Analytics & Monitoring

### **Vercel Analytics**
- Enable in Vercel dashboard
- Track subdomain performance
- Monitor error rates

### **Custom Tracking**
```javascript
// Track café visits
useEffect(() => {
  if (menu) {
    // Analytics code here
    console.log(`Café visited: ${menu.cafe_name}`)
  }
}, [menu])
```

## 🔒 Security

### **Headers**
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Automatic HTTPS redirect

### **Database Security**
- ✅ Row Level Security (RLS) enabled
- ✅ Public read access to active records only
- ✅ No sensitive data exposure

## 🚀 Performance Optimization

### **Caching Strategy**
```javascript
// Add to [cafe]/page.tsx for caching
export const revalidate = 300 // 5 minutes

// Or use ISR
export async function generateStaticParams() {
  const { data: cafes } = await supabase
    .from('cafes')
    .select('slug')
    .eq('is_active', true)
  
  return cafes?.map(cafe => ({ cafe: cafe.slug })) || []
}
```

### **Database Optimization**
- ✅ Use `cafe_menu_json` view for single query
- ✅ Indexes on slug and is_active columns
- ✅ Efficient JSON aggregation

## ✅ Deployment Checklist

Before going live:

- [ ] Supabase database schema deployed
- [ ] Environment variables configured in Vercel
- [ ] Domain `lazlle.studio` added to Vercel
- [ ] Wildcard `*.lazlle.studio` configured
- [ ] DNS records updated
- [ ] SSL certificates active
- [ ] Test café created and accessible
- [ ] Admin panel working at root domain
- [ ] Mobile responsiveness verified
- [ ] Error pages tested

## 🎯 Example URLs

After deployment, these URLs will work:

```
https://lazlle.studio → Admin Panel
https://www.lazlle.studio → Admin Panel
https://demo-cafe.lazlle.studio → Demo Café Menu
https://karibu.lazlle.studio → Karibu Café Menu
https://pizza-palace.lazlle.studio → Pizza Palace Menu
https://nonexistent.lazlle.studio → "Café not found"
```

Your wildcard subdomain system is now ready for deployment! 🎉