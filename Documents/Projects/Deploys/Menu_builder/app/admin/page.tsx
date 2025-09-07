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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Minimal Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-cyan-500/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-orange-500/6 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Spectacular Header */}
        <div className="text-center mb-16 animate-fade-in">
          {/* Main Logo & Title */}
          <div className="relative mb-8">
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                <LazlleLogo size="hero" className="relative transform hover:scale-105 transition-all duration-500" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full animate-pulse shadow-lg shadow-orange-400/50"></div>
              </div>
              <div className="text-left">
                <h1 className="text-6xl font-black text-slate-50 mb-2 tracking-tight">
                  MenuCraft Pro
                </h1>
                <p className="text-lg gradient-text-accent font-semibold uppercase tracking-[0.3em]">by Lazlle & Co</p>
              </div>
            </div>

            {/* Subtitle with Animation */}
            <div className="max-w-4xl mx-auto mb-8">
              <h2 className="text-2xl font-semibold text-slate-200 mb-4 leading-tight">
                Professional Digital Menu Generator
              </h2>
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                Create stunning QR-based menus for modern restaurants. Simple, fast, and professional.
              </p>
              <div className="flex items-center justify-center gap-8 text-sm font-medium text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                  Your Growth Engine
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  Premium Solutions
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                  Instant Results
                </span>
              </div>
            </div>
          </div>



          {/* Connection Status with Premium Design */}
          {connectionStatus.tested && (
            <div className={`max-w-md mx-auto p-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 ${connectionStatus.success
              ? 'glass-card border-teal-500/40 shadow-lg shadow-teal-500/10 animate-slide-up'
              : 'glass-card border-red-500/40 shadow-lg shadow-red-500/10 animate-shake'
              }`}>
              {connectionStatus.success ? (
                <CheckCircle className="w-6 h-6 text-teal-400" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400" />
              )}
              <span className="font-medium text-slate-100">{connectionStatus.message}</span>
            </div>
          )}
        </div>

        {qrCode && generatedUrl && (
          <div className="relative mb-12 animate-slide-up">
            {/* Success Celebration Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-3xl blur-xl animate-pulse-glow"></div>

            <div className="relative backdrop-blur-xl bg-slate-800/30 border border-green-500/30 rounded-3xl p-12 shadow-2xl">
              {/* Success Header */}
              <div className="text-center mb-10">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                  <CheckCircle className="relative w-20 h-20 text-green-400 animate-bounce mx-auto" />
                </div>
                <h2 className="text-5xl font-black bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
                  🎉 Menu Created Successfully!
                </h2>
                <p className="text-xl text-white/80">Your digital masterpiece is ready to amaze customers</p>
              </div>

              {/* Live Menu Card */}
              <div className="backdrop-blur-xl bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 mb-8 shadow-xl hover:shadow-purple-500/10 transition-all duration-500 transform hover:scale-105 group">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white/90 mb-3">🚀 Your menu is now LIVE!</h3>
                  <div className="relative inline-block">
                    <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                    <a
                      href={generatedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        <span className="text-xl">Visit Your Menu</span>
                        <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </span>
                    </a>
                  </div>
                  <p className="text-white/60 mt-4 font-mono text-sm bg-black/20 rounded-xl p-3 border border-white/10">
                    {generatedUrl}
                  </p>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="backdrop-blur-xl bg-slate-800/30 border border-slate-700/50 rounded-2xl p-10 text-center shadow-xl hover:shadow-purple-500/10 transition-all duration-500 transform hover:scale-105 group">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
                  📱 Premium QR Code
                </h3>
                <div className="relative inline-block mb-6">
                  {/* QR Code Glow Effect */}
                  <div className="absolute -inset-6 bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-purple-500/30 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                  <div className="relative p-6 bg-white rounded-3xl shadow-2xl group-hover:scale-105 transition-transform duration-500">
                    <img
                      src={qrCode}
                      alt="Premium QR Code"
                      className="w-64 h-64 mx-auto rounded-2xl"
                    />
                  </div>
                </div>
                <div className="max-w-md mx-auto">
                  <p className="text-white/80 text-lg leading-relaxed mb-4">
                    Print this premium QR code and place it on tables for instant customer access
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-white/60">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      High Resolution
                    </span>
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      Print Ready
                    </span>
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                      Instant Scan
                    </span>
                  </div>
                </div>
              </div>

              {/* Agency Signature */}
              <div className="mt-10 pt-8 border-t border-white/10 text-center">
                <div className="flex flex-col items-center justify-center gap-4 mb-3">
                  <LazlleLogo size="md" />
                  <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent font-bold text-lg">Crafted with precision by Lazlle & Co</span>
                </div>
                <p className="text-slate-400 text-sm">Your Growth Engine • Premium Digital Solutions</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Café Information Section */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-teal-600/15 via-cyan-600/15 to-teal-600/15 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div className="relative glass-card hover:shadow-teal-500/10 transition-all duration-500 transform hover:scale-[1.01] p-8">
              {/* Section Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Coffee className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-100 mb-1">Café Information</h2>
                  <p className="text-slate-400">Tell us about your restaurant</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Café Name */}
                <div className="relative group/field">
                  <label className="form-label">
                    Café Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field text-lg font-semibold"
                    value={formData.cafeName}
                    onChange={(e) => setFormData(prev => ({ ...prev, cafeName: e.target.value }))}
                    placeholder="Enter your café's name"
                  />
                </div>

                {/* Logo Upload */}
                <div className="relative group/field">
                  <label className="form-label">
                    Logo Upload
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-teal-500 file:to-cyan-500 file:text-white file:font-medium hover:file:scale-105 file:transition-transform file:duration-300"
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      logo: e.target.files?.[0]
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* Location */}
                <div className="relative group/field">
                  <label className="form-label">
                    Location
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Downtown Mumbai, MG Road"
                  />
                </div>

                {/* Timings */}
                <div className="relative group/field">
                  <label className="form-label">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.timings}
                    onChange={(e) => setFormData(prev => ({ ...prev, timings: e.target.value }))}
                    placeholder="e.g., 9:00 AM - 11:00 PM"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Menu Categories Section */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/15 via-cyan-500/15 to-teal-500/15 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div className="relative glass-card hover:shadow-teal-500/10 transition-all duration-500 transform hover:scale-[1.01] p-8">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-lg opacity-50"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-2xl">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-100 mb-1">Menu Categories</h2>
                    <p className="text-slate-400">Organize your delicious offerings</p>
                  </div>
                </div>

                {/* Add Category Button */}
                <div className="relative group/btn">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-lg opacity-50 group-hover/btn:opacity-75 transition-opacity duration-300"></div>
                  <button
                    type="button"
                    onClick={addCategory}
                    className="relative px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105 group/add"
                  >
                    <span className="flex items-center gap-3">
                      <Plus className="w-5 h-5 group-hover/add:rotate-90 transition-transform duration-300" />
                      <span className="font-bold">Add Category</span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Categories List */}
              <div className="space-y-8">
                {formData.categories.map((category, categoryIndex) => (
                  <div
                    key={categoryIndex}
                    className="relative group/category animate-slide-up"
                    style={{ animationDelay: `${categoryIndex * 150}ms` }}
                  >
                    {/* Category Card */}
                    <div className="backdrop-blur-xl bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 shadow-xl hover:shadow-purple-500/10 transition-all duration-500 transform hover:scale-[1.02]">
                      {/* Category Header */}
                      <div className="flex items-center gap-6 mb-8">
                        <div className="flex-1 relative group/input">
                          <label className="block text-lg font-semibold text-white/90 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                              {categoryIndex + 1}
                            </div>
                            Category Name *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              className="w-full px-6 py-4 bg-slate-900/50 border border-slate-600/50 rounded-2xl text-white/90 text-xl font-semibold placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300"
                              value={category.name}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                categories: prev.categories.map((cat, i) =>
                                  i === categoryIndex ? { ...cat, name: e.target.value } : cat
                                )
                              }))}
                              placeholder="e.g., Appetizers, Main Course, Desserts"
                            />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                          </div>
                        </div>

                        {/* Remove Category Button */}
                        {formData.categories.length > 1 && (
                          <div className="relative group/delete">
                            <button
                              type="button"
                              onClick={() => removeCategory(categoryIndex)}
                              className="p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-2xl transition-all duration-300 transform hover:scale-110 group-hover/delete:rotate-12"
                            >
                              <Trash2 className="w-6 h-6 text-red-400" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Menu Items Section */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                            Menu Items
                          </h4>
                          <button
                            type="button"
                            onClick={() => addMenuItem(categoryIndex)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 group/add-item"
                          >
                            <span className="flex items-center gap-2">
                              <Plus className="w-4 h-4 group-hover/add-item:rotate-90 transition-transform duration-300" />
                              <span>Add Item</span>
                            </span>
                          </button>
                        </div>

                        {/* Items Grid */}
                        <div className="space-y-6">
                          {category.items.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className="backdrop-blur-xl bg-slate-900/30 border border-slate-600/50 rounded-2xl p-6 shadow-lg hover:shadow-blue-500/10 transition-all duration-500 transform hover:scale-[1.02] animate-slide-up group/item"
                              style={{ animationDelay: `${itemIndex * 100}ms` }}
                            >
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                                {/* Item Name */}
                                <div className="lg:col-span-4 relative group/field">
                                  <label className="block text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                                    Item Name *
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white/90 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
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

                                {/* Price */}
                                <div className="lg:col-span-3 relative group/field">
                                  <label className="block text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                                    Price (₹) *
                                  </label>
                                  <input
                                    type="number"
                                    required
                                    min="1"
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white/90 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300"
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

                                {/* Description */}
                                <div className="lg:col-span-4 relative group/field">
                                  <label className="block text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                                    Description
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white/90 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
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

                                {/* Remove Button */}
                                <div className="lg:col-span-1 flex items-end justify-center">
                                  {category.items.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeMenuItem(categoryIndex, itemIndex)}
                                      className="p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-xl transition-all duration-300 transform hover:scale-110 group-hover:rotate-12"
                                    >
                                      <Trash2 className="w-5 h-5 text-red-400" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center relative">
            <div className="relative inline-block group">
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 animate-pulse-glow"></div>
              <button
                type="submit"
                disabled={loading || !connectionStatus.success}
                className="relative px-12 py-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-black text-xl rounded-3xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-4 mx-auto"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Creating Your Masterpiece...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">Generate Digital Menu</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Premium Footer */}
          <div className="text-center pt-12 mt-12 border-t border-white/10 relative">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <div className="mb-8">
              <LazlleLogo size="xl" showText={true} className="justify-center mb-6 hover:scale-110 transition-transform duration-500" />
              <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                Lazlle & Co Digital Solutions
              </h3>
              <p className="text-white/70 text-lg leading-relaxed max-w-2xl mx-auto mb-6">
                Empowering restaurants with cutting-edge digital solutions that drive growth, enhance customer experience, and maximize revenue potential.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 max-w-4xl mx-auto">
              <div className="backdrop-blur-xl bg-slate-800/20 border border-slate-700/30 rounded-2xl p-6 hover:bg-slate-800/30 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">🚀</span>
                </div>
                <h4 className="text-white/90 font-semibold mb-2">Growth Engine</h4>
                <p className="text-white/60 text-sm">Accelerating business success through innovative digital strategies</p>
              </div>

              <div className="backdrop-blur-xl bg-slate-800/20 border border-slate-700/30 rounded-2xl p-6 hover:bg-slate-800/30 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">💎</span>
                </div>
                <h4 className="text-white/90 font-semibold mb-2">Premium Quality</h4>
                <p className="text-white/60 text-sm">Delivering excellence in every project with attention to detail</p>
              </div>

              <div className="backdrop-blur-xl bg-slate-800/20 border border-slate-700/30 rounded-2xl p-6 hover:bg-slate-800/30 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">⚡</span>
                </div>
                <h4 className="text-white/90 font-semibold mb-2">Instant Results</h4>
                <p className="text-white/60 text-sm">Fast deployment and immediate impact on your business metrics</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-white/60 mb-6">
              <a href="mailto:lazlleandco@gmail.com" className="hover:text-blue-400 transition-colors duration-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                Contact Us
              </a>
              <a href="https://www.lazlle.studio" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors duration-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></span>
                Portfolio
              </a>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></span>
                Digital Growth Solutions
              </span>
            </div>

            <div className="text-center">
              <p className="text-white/40 text-sm">
                © 2024 Lazlle & Co. All rights reserved. • Your Growth Engine • Premium Digital Solutions
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}