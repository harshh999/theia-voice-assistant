'use client'

import { useState, useEffect } from 'react'
import { MenuService } from '@/lib/menu-service'
import { CafeWithMenu } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { ChevronDown, ChevronUp, MapPin, Clock, Coffee } from 'lucide-react'
import Image from 'next/image'
import LazlleLogo from './LazlleLogo'

interface MenuPageProps {
  slug: string
}

export default function MenuPage({ slug }: MenuPageProps) {
  const [cafeMenu, setCafeMenu] = useState<CafeWithMenu | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchMenuData()
  }, [slug])

  const fetchMenuData = async () => {
    try {
      const menuData = await MenuService.getCafeMenuBySlug(slug)
      setCafeMenu(menuData)
      
      // Expand first category by default
      if (menuData && menuData.categories.length > 0) {
        setExpandedCategories(new Set([menuData.categories[0].category_id]))
      }

    } catch (error) {
      console.error('Error fetching menu data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dots relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>
        <div className="relative z-10 text-center animate-fade-in">
          <div className="relative mb-8">
            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-lg opacity-50 animate-glow-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
              <Coffee className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-4">Loading Your Menu</h2>
          <p className="text-slate-400 text-lg">Preparing something delicious...</p>
          <div className="mt-6 flex justify-center">
            <div className="w-16 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!cafeMenu) {
    return (
      <div className="min-h-screen bg-dots relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-float"></div>
        </div>
        <div className="relative z-10 text-center animate-fade-in">
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
              <Coffee className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">Menu Not Found</h1>
          <p className="text-slate-400 text-lg mb-8">The requested menu could not be found.</p>
          <div className="text-sm text-slate-500">
            Powered by <span className="font-semibold gradient-text">Lazlle & Co</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '6s'}}></div>
      </div>
      
      <div className="relative z-10 bg-dots">
        {/* Clean Header */}
        <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50 backdrop-blur-xl">
          <div className="max-w-lg mx-auto px-6 py-8">
            <div className="text-center animate-fade-in">
              {/* Logo */}
              {cafeMenu.logo_url && (
                <div className="mb-6">
                  <div className="relative inline-block">
                    <Image
                      src={cafeMenu.logo_url}
                      alt={`${cafeMenu.cafe_name} logo`}
                      width={80}
                      height={80}
                      className="mx-auto rounded-full object-cover shadow-xl border-2 border-slate-600 hover-scale"
                    />
                  </div>
                </div>
              )}
              
              {/* Restaurant Name */}
              <h1 className="text-4xl font-bold gradient-text mb-4">
                {cafeMenu.cafe_name}
              </h1>
              
              {/* Location & Timing */}
              {(cafeMenu.location || cafeMenu.timings) && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                  {cafeMenu.location && (
                    <div className="glass-card px-4 py-2 rounded-xl border border-slate-600/50 hover-glow">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <MapPin className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-slate-200 font-medium">{cafeMenu.location}</span>
                      </div>
                    </div>
                  )}
                  {cafeMenu.timings && (
                    <div className="glass-card px-4 py-2 rounded-xl border border-slate-600/50 hover-glow">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                          <Clock className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-slate-200 font-medium">{cafeMenu.timings}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menu Categories */}
        <div className="max-w-2xl mx-auto px-6 py-12">
          {cafeMenu.categories.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <Coffee className="w-10 h-10 text-white" />
              </div>
              <p className="text-slate-400 text-xl">No menu items available.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {cafeMenu.categories
                .sort((a, b) => a.order_index - b.order_index)
                .map((category, index) => (
                <div 
                  key={category.category_id} 
                  className="glass-card hover-lift animate-slide-up"
                  style={{animationDelay: `${index * 100}ms`}}
                >
                  <button
                    onClick={() => toggleCategory(category.category_id)}
                    className="w-full p-6 flex items-center justify-between group transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform duration-300">
                        {index + 1}
                      </div>
                      <div className="text-left">
                        <h2 className="text-2xl font-bold gradient-text group-hover:scale-105 transition-transform duration-300">
                          {category.category_name}
                        </h2>
                        <p className="text-slate-400 text-sm">
                          {category.items?.length || 0} items
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="glass-card px-3 py-1 rounded-lg border border-slate-600/50">
                        <span className="text-slate-300 font-semibold text-sm">
                          {category.items?.length || 0}
                        </span>
                      </div>
                      {expandedCategories.has(category.category_id) ? (
                        <ChevronUp className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-slate-400 group-hover:scale-110 transition-transform duration-300" />
                      )}
                    </div>
                  </button>
                  
                  {/* Expanded Items */}
                  {expandedCategories.has(category.category_id) && (
                    <div className="border-t border-slate-700/50 animate-slide-down">
                      {category.items && category.items.length > 0 ? (
                        <div className="p-6 space-y-4">
                          {category.items
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((item, itemIndex) => (
                            <div 
                              key={item.id} 
                              className="glass-card p-6 hover-lift group animate-fade-in"
                              style={{animationDelay: `${itemIndex * 50}ms`}}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1 pr-6">
                                  <h3 className="text-xl font-bold text-slate-200 mb-2 group-hover:gradient-text transition-all duration-300">
                                    {item.name}
                                  </h3>
                                  {item.description && (
                                    <p className="text-slate-400 leading-relaxed">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="glass-card px-4 py-2 rounded-xl border border-emerald-500/30">
                                    <span className="text-xl font-bold gradient-text">
                                      {formatPrice(item.price)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-12 text-center">
                          <Coffee className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                          <p className="text-slate-400">No items in this category</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spectacular Footer */}
        <div className="glass-ultra border-t border-white/10 mt-16 backdrop-blur-2xl">
          <div className="max-w-2xl mx-auto px-6 py-12 text-center">
            <div className="mb-8">
              <div className="flex items-center justify-center gap-4 mb-6">
                <LazlleLogo size="lg" className="hover:scale-110 transition-transform duration-500" />
                <span className="text-3xl font-black gradient-text-primary">MenuCraft Pro</span>
              </div>
              
              <p className="text-xl text-white/80 mb-6">
                Professional digital menu solutions
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <a 
                href="mailto:lazlleandco@gmail.com" 
                className="glass-card p-6 hover-lift-intense group/contact"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover/contact:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-xl">@</span>
                </div>
                <h4 className="text-white font-bold text-lg mb-2">Email Us</h4>
                <p className="text-white/60">lazlleandco@gmail.com</p>
              </a>
              
              <a 
                href="https://www.lazlle.studio" 
                target="_blank" 
                rel="noopener noreferrer"
                className="glass-card p-6 hover-lift-intense group/contact"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover/contact:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-xl">🌐</span>
                </div>
                <h4 className="text-white font-bold text-lg mb-2">Visit Us</h4>
                <p className="text-white/60">www.lazlle.studio</p>
              </a>
            </div>
            
            <div className="pt-8 border-t border-white/10">
              <p className="text-white/50 text-lg">
                © 2024 <span className="gradient-text-accent font-bold">Lazlle & Co</span> • Your Growth Engine
              </p>
              <p className="text-white/30 mt-2">
                Crafting digital experiences that transform businesses
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}