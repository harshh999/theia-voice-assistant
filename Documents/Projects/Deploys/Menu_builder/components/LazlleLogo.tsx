import Image from 'next/image'
import { useState } from 'react'

interface LazlleLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero'
  showText?: boolean
  className?: string
}

export default function LazlleLogo({
  size = 'md',
  showText = false,
  className = ''
}: LazlleLogoProps) {
  const [imageError, setImageError] = useState(false)
  // Optimized sizes - much smaller and more appropriate
  const logoSizes = {
    xs: { width: 40, height: 20 },      // Footer, small cards
    sm: { width: 60, height: 30 },      // Contact cards, navigation
    md: { width: 80, height: 40 },      // Standard usage
    lg: { width: 100, height: 50 },     // Header sections
    xl: { width: 140, height: 70 },     // Large headers
    hero: { width: 180, height: 90 }    // Hero sections, main branding
  }

  const containerClasses = {
    xs: 'h-5',
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16',
    hero: 'h-20'
  }

  const glowClasses = {
    xs: 'hover:drop-shadow-md',
    sm: 'hover:drop-shadow-lg',
    md: 'hover:drop-shadow-xl',
    lg: 'hover:drop-shadow-2xl',
    xl: 'hover:drop-shadow-2xl hover:brightness-110',
    hero: 'hover:drop-shadow-2xl hover:brightness-110 hover:scale-105'
  }

  // Fallback logo component when image is missing
  const FallbackLogo = () => (
    <div className={`${containerClasses[size]} flex items-center justify-center bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg shadow-lg`}>
      <div className="text-white font-bold text-center">
        <div className="text-xs font-black tracking-wider">LAZLLE</div>
        {size !== 'xs' && <div className="text-xs opacity-80">& CO</div>}
      </div>
    </div>
  )

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`relative ${containerClasses[size]} flex items-center justify-center`}>
        {!imageError ? (
          <Image
            src="/lazlle-logo.png"
            alt="Lazlle & Co - Your Growth Engine"
            width={logoSizes[size].width}
            height={logoSizes[size].height}
            className={`object-contain filter drop-shadow-lg ${glowClasses[size]} transition-all duration-500 ease-out`}
            priority={size === 'hero' || size === 'xl'}
            onError={() => setImageError(true)}
          />
        ) : (
          <FallbackLogo />
        )}
      </div>

      {/* Optional branding text for specific contexts */}
      {showText && (size === 'lg' || size === 'xl' || size === 'hero') && (
        <div className="ml-4 text-left">
          <div className="text-white/80 text-sm font-medium uppercase tracking-wider">
            Digital Solutions
          </div>
          <div className="text-white/60 text-xs uppercase tracking-widest">
            Your Growth Engine
          </div>
        </div>
      )}
    </div>
  )
}