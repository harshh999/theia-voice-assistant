import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')
  
  if (!host) {
    return NextResponse.next()
  }

  // Extract subdomain from host
  const hostname = host.split(':')[0] // Remove port if present
  const parts = hostname.split('.')
  
  // Check if it's the root domain (lazlle.studio or www.lazlle.studio)
  const isRootDomain = 
    hostname === 'lazlle.studio' || 
    hostname === 'www.lazlle.studio' ||
    hostname === 'localhost' ||
    hostname.startsWith('localhost:')

  // If it's root domain, serve normally
  if (isRootDomain) {
    return NextResponse.next()
  }

  // Extract subdomain (first part before lazlle.studio)
  let subdomain = ''
  
  if (parts.length >= 3) {
    // For production: subdomain.lazlle.studio
    subdomain = parts[0]
  } else if (hostname.includes('vercel.app') && parts.length >= 2) {
    // For Vercel preview: subdomain-project.vercel.app
    const firstPart = parts[0]
    const subdomainMatch = firstPart.match(/^(.+?)-/)
    if (subdomainMatch) {
      subdomain = subdomainMatch[1]
    }
  }

  // If no valid subdomain found, serve normally
  if (!subdomain || subdomain === 'www') {
    return NextResponse.next()
  }

  // Rewrite to dynamic cafe route
  const url = request.nextUrl.clone()
  url.pathname = `/${subdomain}${url.pathname === '/' ? '' : url.pathname}`
  
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - admin (admin panel)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|admin).*)',
  ],
}