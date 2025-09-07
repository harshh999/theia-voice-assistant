'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { MenuService } from '@/lib/menu-service'
import { testSupabaseConnection } from '@/lib/test-connection'
import { createSlug, generateQRCode } from '@/lib/utils'
import { MenuFormData } from '@/lib/types'
import { Plus, Trash2, Coffee, CheckCircle, XCircle } from 'lucide-react'
import LazlleLogo from '@/components/LazlleLogo'

export default function AdminPage() {
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean
    success: boolean
    message: string
  }>({ tested: false, success: false, message: '' })

  const [formData, setFormData] = useState<MenuFormData>({
    cafeName: '',
    location: '',
    timings: '',
    categories: [
      {
        name: '',
        items: [{ name: '', price: 0, description: '' }]
      }
    ]
  })

  useEffect(() => {
    const checkConnection = async () => {
      const result = await testSupabaseConnection()
      setConnectionStatus({
        tested: true,
        success: result.success,
        message: result.message
      })
    }
    checkConnection()
  }, [])

  const addCategory = () => {
    setFormData(prev => ({
      ...prev,
      categories: [
        ...prev.categories,
        { name: '', items: [{ name: '', price: 0, description: '' }] }
      ]
    }))
  }

  const removeCategory = (categoryIndex: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== categoryIndex)
    }))
  }

  const addMenuItem = (categoryIndex: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, i) =>
        i === categoryIndex
          ? { ...cat, items: [...cat.items, { name: '', price: 0, description: '' }] }
          : cat
      )
    }))
  }

  const removeMenuItem = (categoryIndex: number, itemIndex: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, i) =>
        i === categoryIndex
          ? { ...cat, items: cat.items.filter((_, j) => j !== itemIndex) }
          : cat
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const slug = createSlug(formData.cafeName)

      const slugExists = await MenuService.checkSlugExists(slug)
      if (slugExists) {
        alert('A café with this name already exists. Please choose a different name.')
        setLoading(false)
        return
      }

      let logoUrl = null
      if (formData.logo) {
        const fileExt = formData.logo.name.split('.').pop()
        const fileName = `${slug}-logo.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('cafe-logos')
          .upload(fileName, formData.logo)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('cafe-logos')
          .getPublicUrl(fileName)

        logoUrl = publicUrl
      }

      const cafeData = {
        name: formData.cafeName,
        slug,
        logo_url: logoUrl,
        location: formData.location,
        timings: formData.timings
      }

      const validCategories = formData.categories
        .filter(cat => cat.name.trim() !== '')
        .map(cat => ({
          name: cat.name,
          items: cat.items.filter(item => item.name.trim() !== '' && item.price > 0)
        }))
        .filter(cat => cat.items.length > 0)

      if (validCategories.length === 0) {
        alert('Please add at least one category with menu items.')
        setLoading(false)
        return
      }

      const result = await MenuService.createCafeWithMenu(cafeData, validCategories)

      if (!result.success) {
        throw new Error(result.error || 'Failed to create menu')
      }

      const menuUrl = `https://${slug}.lazlle.studio`
      const qrCodeData = await generateQRCode(menuUrl)

      setQrCode(qrCodeData)
      setGeneratedUrl(menuUrl)

      alert('Menu created successfully!')

    } catch (error) {
      console.error('Error creating menu:', error)
      alert(`Error creating menu: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dots relative overflow-hidden">
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Elegant Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-lg opacity-50 animate-glow-pulse"></div>
              <LazlleLogo size="hero" className="relative hover-scale" />
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-black gradient-text mb-2">
                MenuCraft Pro
              </h1>
              <p className="text-slate-400 font-semibold text-lg">by Lazlle & Co</p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-slate-200 mb-4 leading-tight">
              Professional Digital Menu Generator
            </h2>
            <p className="text-slate-400 text-xl leading-relaxed">
              Create stunning QR-based menus for modern restaurants. Elegant, fast, and professional.
            </p>
          </div>

          {/* Enhanced Contact Info */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="glass-card p-8 hover-lift hover-glow">
              <div className="flex items-center justify-center mb-6">
                <LazlleLogo size="lg" className="hover-scale" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <a 
                  href="mailto:lazlleandco@gmail.com" 
                  className="glass-card p-6 hover-lift hover-glow group transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-bold text-xl">@</span>
                  </div>
                  <h3 className="text-slate-200 font-semibold mb-2">Email</h3>
                  <p className="text-slate-400 text-sm">lazlleandco@gmail.com</p>
                </a>
                
                <a 
                  href="https://www.lazlle.studio" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="glass-card p-6 hover-lift hover-glow group transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-bold text-xl">🌐</span>
                  </div>
                  <h3 className="text-slate-200 font-semibold mb-2">Website</h3>
                  <p className="text-slate-400 text-sm">www.lazlle.studio</p>
                </a>
                
                <a 
                  href="tel:+916351324531" 
                  className="glass-card p-6 hover-lift hover-glow group transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-bold text-xl">📱</span>
                  </div>
                  <h3 className="text-slate-200 font-semibold mb-2">Phone</h3>
                  <p className="text-slate-400 text-sm">+91 6351324531</p>
                </a>
              </div>
            </div>
          </div>

          {/* Enhanced Connection Status */}
          {connectionStatus.tested && (
            <div className={`max-w-lg mx-auto status-badge ${connectionStatus.success ? 'status-success' : 'status-error'} animate-slide-down`}>
              {connectionStatus.success ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
              <span className="text-lg">{connectionStatus.message}</span>
            </div>
          )}
        </div>

        {/* Success Card */}
        {qrCode && generatedUrl && (
          <div className="card mb-12 text-center animate-slide-up bg-emerald-500/10 border-emerald-500/30">
            <div className="flex items-center justify-center gap-3 mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
              <h2 className="text-3xl font-bold gradient-text">Menu Created Successfully!</h2>
            </div>

            <div className="glass-card p-8 mb-8 hover-glow">
              <p className="text-slate-300 text-lg mb-6">🎉 Your digital menu is now live at:</p>
              <a
                href={generatedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-3 text-xl mb-4"
              >
                <span>Visit Menu</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <p className="text-slate-400 font-mono text-sm bg-slate-800/50 rounded-xl p-4 border border-slate-700">{generatedUrl}</p>
            </div>

            <div className="glass-card p-8 hover-glow">
              <h3 className="text-2xl font-bold gradient-text mb-6">📱 QR Code</h3>
              <div className="inline-block p-6 bg-white rounded-2xl shadow-2xl hover-scale">
                <img src={qrCode} alt="QR Code" className="w-56 h-56 mx-auto" />
              </div>
              <p className="text-slate-400 mt-6 text-lg">Print and place on tables for easy customer access</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Café Information */}
          <div className="card hover-lift animate-slide-up">
            <div className="section-header">
              <div className="section-icon">
                <Coffee className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-bold gradient-text">Café Information</h2>
                <p className="text-slate-400 mt-2">Tell us about your restaurant</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label className="form-label">Café Name *</label>
                <input
                  type="text"
                  required
                  className="input-field text-lg font-semibold"
                  value={formData.cafeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, cafeName: e.target.value }))}
                  placeholder="Enter café name"
                />
              </div>

              <div>
                <label className="form-label">Logo Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  className="input-field"
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    logo: e.target.files?.[0]
                  }))}
                />
              </div>

              <div>
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter location"
                />
              </div>

              <div>
                <label className="form-label">Operating Hours</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.timings}
                  onChange={(e) => setFormData(prev => ({ ...prev, timings: e.target.value }))}
                  placeholder="e.g., 9:00 AM - 10:00 PM"
                />
              </div>
            </div>
          </div>

          {/* Menu Categories */}
          <div className="card hover-lift animate-slide-up">
            <div className="flex items-center justify-between mb-8">
              <div className="section-header mb-0">
                <div className="section-icon bg-gradient-to-br from-emerald-500 to-teal-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold gradient-text">Menu Categories</h2>
                  <p className="text-slate-400 mt-2">Organize your delicious offerings</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addCategory}
                className="btn-secondary flex items-center gap-3 hover-glow"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Add Category</span>
              </button>
            </div>

            <div className="space-y-8">
              {formData.categories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="glass-card p-8 hover-lift">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {categoryIndex + 1}
                    </div>
                    <div className="flex-1">
                      <label className="form-label">Category Name *</label>
                      <input
                        type="text"
                        required
                        className="input-field text-xl font-semibold"
                        value={category.name}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          categories: prev.categories.map((cat, i) =>
                            i === categoryIndex ? { ...cat, name: e.target.value } : cat
                          )
                        }))}
                        placeholder="e.g., Beverages, Main Course"
                      />
                    </div>
                    {formData.categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCategory(categoryIndex)}
                        className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-300"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-bold text-slate-200">Menu Items</h4>
                      <button
                        type="button"
                        onClick={() => addMenuItem(categoryIndex)}
                        className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-2 font-semibold"
                      >
                        <Plus className="w-4 h-4" />
                        Add Item
                      </button>
                    </div>

                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 bg-slate-800/30 rounded-xl border border-slate-700/50">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-2">Item Name *</label>
                          <input
                            type="text"
                            required
                            className="input-field font-semibold"
                            value={item.name}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              categories: prev.categories.map((cat, i) =>
                                i === categoryIndex
                                  ? {
                                    ...cat,
                                    items: cat.items.map((itm, j) =>
                                      j === itemIndex ? { ...itm, name: e.target.value } : itm
                                    )
                                  }
                                  : cat
                              )
                            }))}
                            placeholder="e.g., Chicken Biryani"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-2">Price (₹) *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            className="input-field font-bold text-emerald-400"
                            value={item.price || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              categories: prev.categories.map((cat, i) =>
                                i === categoryIndex
                                  ? {
                                    ...cat,
                                    items: cat.items.map((itm, j) =>
                                      j === itemIndex ? { ...itm, price: parseInt(e.target.value) || 0 } : itm
                                    )
                                  }
                                  : cat
                              )
                            }))}
                            placeholder="250"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-2">Description</label>
                          <input
                            type="text"
                            className="input-field"
                            value={item.description}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              categories: prev.categories.map((cat, i) =>
                                i === categoryIndex
                                  ? {
                                    ...cat,
                                    items: cat.items.map((itm, j) =>
                                      j === itemIndex ? { ...itm, description: e.target.value } : itm
                                    )
                                  }
                                  : cat
                              )
                            }))}
                            placeholder="Optional description"
                          />
                        </div>

                        <div className="flex items-end">
                          {category.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMenuItem(categoryIndex, itemIndex)}
                              className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-300"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={loading || !connectionStatus.success}
              className="btn-primary px-12 py-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4 mx-auto hover-glow"
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Menu...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Digital Menu
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="text-center pt-12 border-t border-slate-700">
            <LazlleLogo size="xl" showText={true} className="justify-center mb-6 hover-scale" />
            <h3 className="text-2xl font-bold gradient-text mb-4">
              Empowering Digital Excellence
            </h3>
            <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
              Transforming restaurants with cutting-edge digital solutions that drive growth and customer engagement
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
              <a href="mailto:lazlleandco@gmail.com" className="glass-card p-4 hover-glow transition-all duration-300">
                <h4 className="text-slate-200 font-semibold mb-1">Contact Us</h4>
                <p className="text-slate-400 text-sm">lazlleandco@gmail.com</p>
              </a>
              <a href="https://www.lazlle.studio" target="_blank" rel="noopener noreferrer" className="glass-card p-4 hover-glow transition-all duration-300">
                <h4 className="text-slate-200 font-semibold mb-1">Our Portfolio</h4>
                <p className="text-slate-400 text-sm">www.lazlle.studio</p>
              </a>
              <div className="glass-card p-4">
                <h4 className="text-slate-200 font-semibold mb-1">Digital Growth</h4>
                <p className="text-slate-400 text-sm">Your Growth Engine</p>
              </div>
            </div>
            <p className="text-slate-500">
              © 2024 <span className="gradient-text font-semibold">Lazlle & Co</span>. All rights reserved.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}