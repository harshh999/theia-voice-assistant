import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MenuCraft Pro - Digital Menu Generator by Lazlle & Co',
  description: 'Professional digital menu generator for modern restaurants. Create stunning QR-based menus in minutes. Built by Lazlle & Co - Your Growth Engine.',
  keywords: 'digital menu, QR menu, restaurant menu, menu generator, Lazlle & Co, growth engine, digital solutions',
  authors: [{ name: 'Lazlle & Co', url: 'https://lazlle.studio' }],
  creator: 'Lazlle & Co',
  publisher: 'Lazlle & Co',
  openGraph: {
    title: 'MenuCraft Pro - Digital Menu Generator by Lazlle & Co',
    description: 'Create stunning digital menus for your restaurant with QR code access. Your Growth Engine.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Lazlle & Co',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MenuCraft Pro - Digital Menu Generator',
    description: 'Create stunning digital menus for your restaurant - by Lazlle & Co',
    creator: '@lazlle',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MenuCraft Pro" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}