'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { MockupEditor } from './mockup-editor'
import { type QuoteItem, type MockupSettings } from '@/types'
import { Upload, Image as ImageIcon, X, AlertCircle } from 'lucide-react'

interface LogoUploadPanelProps {
  item: QuoteItem
  onClose: () => void
  onMockupSaved: (itemId: string, mockupUrl: string, settings: MockupSettings) => void
}

interface UploadedLogo {
  path: string
  url: string
  mimeType: string
}

export function LogoUploadPanel({ item, onClose, onMockupSaved }: LogoUploadPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [logo, setLogo] = useState<UploadedLogo | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload-logo', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) {
        setUploadError(json.error ?? 'Upload failed')
        return
      }

      setLogo({ path: json.path, url: json.url, mimeType: json.mimeType })
    } catch {
      setUploadError('Network error during upload.')
    } finally {
      setUploading(false)
      // Reset input so same file can be re-uploaded
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleMockupSaved(mockupUrl: string, settings: MockupSettings) {
    onMockupSaved(item.id, mockupUrl, settings)
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-slate-500" />
          <h4 className="text-sm font-medium text-slate-800">Logo Mockup</h4>
          {item.product?.name && (
            <span className="text-xs text-slate-400">for {item.product.name}</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Upload area */}
      {!logo && (
        <div>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500">Uploading…</p>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">Click to upload logo</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, or SVG · Max 10MB</p>
                <p className="text-xs text-slate-300 mt-1">
                  PNG with transparency works best for clean silver treatment
                </p>
              </>
            )}
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {uploadError}
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Show existing mockup if present */}
          {item.mockup_url && (
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2">Current mockup:</p>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.mockup_url}
                  alt="Current mockup"
                  className="h-20 w-20 object-cover rounded-lg border border-slate-200"
                />
                <div>
                  <p className="text-xs text-slate-500">Upload a new logo to regenerate.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mockup editor — shown after upload */}
      {logo && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
              ✓ Logo uploaded
            </p>
            <button
              onClick={() => setLogo(null)}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Upload different logo
            </button>
          </div>

          <MockupEditor
            quoteItemId={item.id}
            itemColor={item.color}
            logoPath={logo.path}
            logoUrl={logo.url}
            logoMimeType={logo.mimeType}
            currentMockupUrl={item.mockup_url}
            currentSettings={item.mockup_settings}
            onMockupSaved={handleMockupSaved}
          />
        </div>
      )}
    </div>
  )
}
