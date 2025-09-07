# Digital Menu Generator

A full-stack Next.js application that creates beautiful digital menus for cafés with automatic subdomain generation, similar to mezbaan.lazlle.studio.

## Features

- **Admin Form**: Create cafés with unlimited categories and menu items
- **Automatic Subdomain Generation**: Each café gets a unique subdomain (e.g., `cafename.lazlle.studio`)
- **Mobile-First Design**: Responsive menus optimized for QR code scanning
- **QR Code Generation**: Automatic QR codes for each menu
- **Logo Upload**: Support for café logos with Supabase storage
- **Clean UI**: Minimal, professional design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Storage)
- **Hosting**: Vercel (with wildcard subdomain support)
- **QR Codes**: qrcode library
- **Icons**: Lucide React

## Quick Start

### 1. Clone and Install

\`\`\`bash
git clone <repository-url>
cd digital-menu-generator
npm install
\`\`\`

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Run the SQL schema in `database/schema.sql` in your Supabase SQL editor
4. Create a storage bucket named `cafe-logos` (this should be created automatically by the schema)

### 3. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

Edit `.env.local`:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000/admin` to create your first menu.

## Deployment on Vercel

### 1. Deploy to Vercel

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

### 2. Configure Custom Domain

1. In your Vercel dashboard, go to your project settings
2. Add your custom domain `lazlle.studio`
3. Add a wildcard domain `*.lazlle.studio`
4. Configure your DNS:
   - Add an A record for `lazlle.studio` pointing to Vercel's IP
   - Add a CNAME record for `*.lazlle.studio` pointing to `cname.vercel-dns.com`

### 3. Environment Variables

Add your Supabase environment variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## How It Works

### Subdomain Routing

The app uses Next.js middleware and dynamic routing to handle subdomains:

1. Main domain (`lazlle.studio`) → Admin form
2. Subdomains (`cafename.lazlle.studio`) → Menu pages
3. The `getSubdomain` utility extracts the subdomain from the hostname
4. Menu data is fetched based on the café slug

### Database Structure

- **cafes**: Store café information and slugs
- **categories**: Menu categories with ordering
- **menu_items**: Individual menu items with prices and descriptions

### File Upload

Café logos are uploaded to Supabase Storage with public access for easy display on menu pages.

## Usage

### Creating a Menu

1. Visit `/admin` (or your main domain)
2. Fill in café details:
   - Café name (required)
   - Logo (optional)
   - Location and timings (optional)
3. Add categories and menu items
4. Submit to generate the menu and QR code

### Accessing Menus

Each café gets a unique URL: `https://cafename.lazlle.studio`

The menu features:
- Café logo and information at the top
- Expandable/collapsible categories
- Clean item display with prices
- Mobile-optimized design

## Customization

### Styling

The app uses Tailwind CSS with custom components in `globals.css`:
- `.btn-primary` and `.btn-secondary` for buttons
- `.input-field` for form inputs
- `.card` for content containers

### Currency

Prices are formatted using `formatPrice` utility (currently set to INR). Modify in `lib/utils.ts` to change currency.

### Branding

Update the footer and branding in `components/MenuPage.tsx` and `app/admin/page.tsx`.

## Development

### Project Structure

\`\`\`
├── app/
│   ├── admin/          # Admin form page
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main page with subdomain routing
├── components/
│   └── MenuPage.tsx    # Menu display component
├── lib/
│   ├── supabase.ts     # Supabase client and types
│   ├── types.ts        # TypeScript interfaces
│   └── utils.ts        # Utility functions
├── database/
│   └── schema.sql      # Database schema
└── README.md
\`\`\`

### Key Functions

- `createSlug()`: Converts café names to URL-safe slugs
- `generateQRCode()`: Creates QR codes for menu URLs
- `getSubdomain()`: Extracts subdomain from hostname
- `formatPrice()`: Formats prices with currency

## Troubleshooting

### Common Issues

1. **Subdomain not working locally**: Use tools like ngrok for local subdomain testing
2. **Logo upload fails**: Check Supabase storage bucket permissions
3. **Menu not found**: Verify the slug matches the database entry
4. **QR code not generating**: Check if the qrcode library is properly installed

### Database Issues

If you encounter database errors:
1. Verify the schema was applied correctly
2. Check RLS policies are enabled
3. Ensure storage bucket exists and has proper permissions

## License

MIT License - feel free to use this project for your own café menu needs!