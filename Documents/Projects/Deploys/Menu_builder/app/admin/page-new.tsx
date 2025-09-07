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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Clean Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-6">
            <LazlleLogo size="lg" showText={false} className="hover-scale" />
            <div className="text-left">
              <h1 className="text-4xl font-bold text-gray-900 mb-1">
                MenuCraft Pro
              </h1>
              <p className="text-gray-600 font-medium">by Lazlle & Co</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              Professional Digital Menu Generator
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Create stunning QR-based menus for modern restaurants. Simple, fast, and professional.
            </p>
          </div>

          {/* Contact Info */}
          <div className="max-w-lg mx-auto mb-8">
            <div className="card hover-lift">
              <div className="flex items-center justify-center mb-4">
                <LazlleLogo size="sm" />
              </div>
              <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                <a 
                  href="mailto:lazlleandco@gmail.com" 
                  className="hover:text-blue-600 transition-colors"
                >
                  📧 lazlleandco@gmail.com
                </a>
                <a 
                  href="https://www.lazlle.studio" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                >
                  🌐 www.lazlle.studio
                </a>
                <a 
                  href="tel:+916351324531" 
                  className="hover:text-blue-600 transition-colors"
                >
                  📱 +91 6351324531
                </a>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          {connectionStatus.tested && (
            <div className={`max-w-md mx-auto status-badge ${connectionStatus.success ? 'status-success' : 'status-error'} animate-slide-down`}>
              {connectionStatus.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span>{connectionStatus.message}</span>
            </div>
          )}
        </div>

        {/* Success Card */}
        {qrCode && generatedUrl && (
          <div className="card mb-8 text-center animate-slide-up bg-green-50 border-green-200">
            <div className="flex items-center justify-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-green-800">Menu Created Successfully!</h2>
            </div>

            <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
              <p className="text-gray-600 mb-4">🎉 Your digital menu is now live at:</p>
              <a
                href={generatedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2 mb-3"
              >
                <span>Visit Menu</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <p className="text-sm text-gray-500 font-mono bg-gray-100 rounded p-2">{generatedUrl}</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📱 QR Code</h3>
              <div className="inline-block p-4 bg-white rounded-lg shadow-md">
                <img src={qrCode} alt="QR Code" className="w-48 h-48 mx-auto" />
              </div>
              <p className="text-sm text-gray-600 mt-4">Print and place on tables for easy customer access</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Café Information */}
          <div className="card hover-lift animate-slide-up">
            <div className="section-header">
              <div className="section-icon">
                <Coffee className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Café Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Café Name *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.cafeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, cafeName: e.target.value }))}
                  placeholder="Enter café name"
                />
              </div>

              <div>
                <label className="form-label">Logo</label>
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
            <div className="flex items-center justify-between mb-6">
              <div className="section-header mb-0">
                <div className="section-icon bg-green-100 text-green-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Menu Categories</h2>
              </div>
              <button
                type="button"
                onClick={addCategory}
                className="btn-secondary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>

            <div className="space-y-6">
              {formData.categories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1">
                      <label className="form-label">Category Name *</label>
                      <input
                        type="text"
                        required
                        className="input-field"
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
                        className="mt-6 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-700">Menu Items</h4>
                      <button
                        type="button"
                        onClick={() => addMenuItem(categoryIndex)}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Item
                      </button>
                    </div>

                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border border-gray-200">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Item Name *</label>
                          <input
                            type="text"
                            required
                            className="input-field"
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
                          <label className="block text-xs font-medium text-gray-600 mb-1">Price (₹) *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            className="input-field"
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
                          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
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
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
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
              className="btn-primary px-8 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Menu...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Digital Menu
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-gray-200">
            <LazlleLogo size="sm" className="justify-center mb-4" />
            <p className="text-gray-600 mb-4">
              Empowering restaurants with professional digital solutions
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-4">
              <a href="mailto:lazlleandco@gmail.com" className="hover:text-blue-600 transition-colors">Contact Us</a>
              <a href="https://www.lazlle.studio" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">Portfolio</a>
              <span>Digital Growth Solutions</span>
            </div>
            <p className="text-sm text-gray-400">
              © 2024 Lazlle & Co. All rights reserved. • Your Growth Engine
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}