'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, Clock, Coffee, Loader2 } from 'lucide-react'
import LazlleLogo from '@/components/LazlleLogo'

interface MenuItem {
  item_id: string
  item_name: string
  description: string | null
  price: number
  order_index: number
  is_available: boolean
}

interface Category {
  category_id: string
  category_name: string
  order_index: number
  items: MenuItem[]
}

interface CafeMenu {
  cafe_id: string
  cafe_name: string
  cafe_slug: string
  logo_url: string | null
  location: string | null
  timings: string | null
  created_at: string
  categories: Category[]
}

interface CafePageProps {
  params: {
    cafe: string
  }
}

export default function CafePage({ params }: CafePageProps) {
  const [menu, setMenu] = useState<CafeMenu | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCafeMenu()
  }, [params.cafe])

  const fetchCafeMenu = async () => {
    try {
      setLoading(true)
      setError(null)

      // Query the cafe_menu_json view
      const { data, error: queryError } = await supabase
        .from('cafe_menu_json')
        .select('menu_data')
        .eq('slug', params.cafe)
        .single()

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          setError('Café not found')
        } else {
          setError('Failed to load menu')
        }
        return
      }

      if (!data?.menu_data) {
        setError('Café not found')
        return
      }

      setMenu(data.menu_data as CafeMenu)
      
      // Expand all categories by default on mobile
      const categoryIds = (data.menu_data as CafeMenu).categories.map(cat => cat.category_id)
      setExpandedCategories(new Set(categoryIds))
      
    } catch (err) {
      console.error('Error fetching cafe menu:', err)
      setError('Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(0)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (error || !menu) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Coffee className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-4">
            {error || 'Café not found'}
          </h1>
          <p className="text-slate-400 mb-8">
            The café you're looking for doesn't exist or is currently unavailable.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <LazlleLogo size="xs" />
            <span>Powered by Lazlle & Co</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {menu.logo_url ? (
              <img 
                src={menu.logo_url} 
                alt={menu.cafe_name}
                className="w-12 h-12 rounded-xl object-cover shadow-lg"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <Coffee className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-100 truncate">
                {menu.cafe_name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                {menu.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{menu.location}</span>
                  </div>
                )}
                {menu.timings && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span className="truncate">{menu.timings}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {menu.categories.length === 0 ? (
          <div className="text-center py-16">
            <Coffee className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-300 mb-2">Menu Coming Soon</h2>
            <p className="text-slate-500">We're working on adding delicious items to our menu.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {menu.categories.map((category) => (
              <div key={category.category_id} className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.category_id)}
                  className="w-full px-6 py-4 text-left hover:bg-slate-800/50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-100">
                      {category.category_name}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">
                        {category.items.filter(item => item.is_available).length} items
                      </span>
                      <div className={`transform transition-transform duration-200 ${
                        expandedCategories.has(category.category_id) ? 'rotate-180' : ''
                      }`}>
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Category Items */}
                {expandedCategories.has(category.category_id) && (
                  <div className="border-t border-slate-700/50">
                    {category.items.length === 0 ? (
                      <div className="px-6 py-8 text-center">
                        <p className="text-slate-500">No items in this category yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-700/30">
                        {category.items
                          .filter(item => item.is_available)
                          .map((item) => (
                          <div key={item.item_id} className="px-6 py-4 hover:bg-slate-800/30 transition-colors duration-200">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-100 mb-1">
                                  {item.item_name}
                                </h3>
                                {item.description && (
                                  <p className="text-sm text-slate-400 leading-relaxed">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex-shrink-0">
                                <span className="text-lg font-bold text-teal-400">
                                  {formatPrice(item.price)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-700/50 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <LazlleLogo size="sm" />
            <span className="text-slate-400 text-sm">Powered by Lazlle & Co</span>
          </div>
          <p className="text-slate-500 text-xs">
            Digital Menu Solutions • Your Growth Engine
          </p>
        </div>
      </div>
    </div>
  )
}