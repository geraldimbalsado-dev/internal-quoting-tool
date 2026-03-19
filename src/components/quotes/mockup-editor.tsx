'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { type MockupSettings } from '@/types'
import { TEMPLATE_W, TEMPLATE_H, PRINT_AREA, DEFAULT_MOCKUP_SETTINGS } from '@/lib/mockup-constants'
import { Move, ZoomIn, ZoomOut, RotateCcw, Wand2, Loader2 } from 'lucide-react'

interface MockupEditorProps {
  quoteItemId: string
  itemColor: string | null
  logoPath: string
  logoUrl: string
  logoMimeType: string
  currentMockupUrl: string | null
  currentSettings: MockupSettings | null
  onMockupSaved: (mockupUrl: string, settings: MockupSettings) => void
}

const PREVIEW_SIZE = 400 // px — display size of the template preview

export function MockupEditor({
  quoteItemId,
  itemColor,
  logoPath,
  logoUrl,
  logoMimeType,
  currentMockupUrl,
  currentSettings,
  onMockupSaved,
}: MockupEditorProps) {
  // Logo position in template coordinates (not preview px)
  const defaultSettings = currentSettings ?? DEFAULT_MOCKUP_SETTINGS
  const [pos, setPos] = useState({ x: defaultSettings.x, y: defaultSettings.y })
  const [scale, setScale] = useState(defaultSettings.scale)

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(currentMockupUrl)

  // Drag state
  const dragging = useRef(false)
  const dragStart = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 })
  const previewRef = useRef<HTMLDivElement>(null)

  // Scale factor: preview px → template coords
  const ratio = TEMPLATE_W / PREVIEW_SIZE

  // Convert template coords → preview px
  const toPreviewPx = (v: number) => v / ratio

  // Logo display size in preview (approximate — matches server-side logic)
  const maxLogoW = PRINT_AREA.width * 0.9
  const maxLogoH = PRINT_AREA.height * 0.9
  // We don't know actual logo dimensions client-side until image loads
  // So we use a reasonable default for the drag handle display
  const approxLogoW = maxLogoW * scale
  const approxLogoH = maxLogoH * scale

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault()
    dragging.current = true
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, posX: pos.x, posY: pos.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    const dx = (e.clientX - dragStart.current.mouseX) * ratio
    const dy = (e.clientY - dragStart.current.mouseY) * ratio
    setPos({
      x: Math.round(dragStart.current.posX + dx),
      y: Math.round(dragStart.current.posY + dy),
    })
  }

  function handlePointerUp() {
    dragging.current = false
  }

  function adjustScale(delta: number) {
    setScale((s) => Math.max(0.1, Math.min(3, Math.round((s + delta) * 10) / 10)))
  }

  function resetPosition() {
    setPos({ x: DEFAULT_MOCKUP_SETTINGS.x, y: DEFAULT_MOCKUP_SETTINGS.y })
    setScale(1.0)
  }

  async function handleGenerate() {
    setError(null)
    setGenerating(true)

    try {
      const res = await fetch('/api/mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteItemId,
          logoPath,
          logoMimeType,
          color: itemColor,
          settings: { x: pos.x, y: pos.y, scale },
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Generation failed')
        return
      }

      const { mockupUrl, settings } = json
      setGeneratedUrl(`${mockupUrl}?t=${Date.now()}`)
      onMockupSaved(mockupUrl, settings)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // Preview coordinate calculations
  const logoPreviewX = toPreviewPx(pos.x)
  const logoPreviewY = toPreviewPx(pos.y)
  const printAreaPreviewX = toPreviewPx(PRINT_AREA.x)
  const printAreaPreviewY = toPreviewPx(PRINT_AREA.y)
  const printAreaPreviewW = toPreviewPx(PRINT_AREA.width)
  const printAreaPreviewH = toPreviewPx(PRINT_AREA.height)

  return (
    <div className="space-y-4">
      <div className="flex gap-6 flex-wrap">
        {/* Preview canvas */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Position Preview — drag to move</p>
          <div
            ref={previewRef}
            className="relative bg-slate-200 rounded-lg overflow-hidden select-none"
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
          >
            {/* Print area indicator */}
            <div
              className="absolute border-2 border-dashed border-white/30 rounded pointer-events-none"
              style={{
                left: printAreaPreviewX,
                top: printAreaPreviewY,
                width: printAreaPreviewW,
                height: printAreaPreviewH,
              }}
            />

            {/* Draggable logo handle */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="absolute cursor-grab active:cursor-grabbing touch-none"
              style={{
                left: logoPreviewX - toPreviewPx(approxLogoW / 2),
                top: logoPreviewY - toPreviewPx(approxLogoH / 2),
                width: toPreviewPx(approxLogoW),
                height: toPreviewPx(approxLogoH),
                minWidth: 40,
                minHeight: 40,
              }}
            >
              {/* Show the uploaded logo as preview (not silver-treated yet) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Logo preview"
                className="w-full h-full object-contain opacity-60"
                draggable={false}
              />
              <div className="absolute inset-0 border-2 border-blue-400/60 border-dashed rounded flex items-center justify-center">
                <Move className="h-4 w-4 text-blue-400/80" />
              </div>
            </div>
          </div>

          <p className="mt-1.5 text-xs text-slate-400">
            Position ({Math.round(pos.x)}, {Math.round(pos.y)}) · Scale {scale.toFixed(1)}×
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 min-w-[160px]">
          {/* Scale controls */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Scale</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustScale(-0.1)}
                className="h-8 w-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
              >
                <ZoomOut className="h-4 w-4 text-slate-600" />
              </button>
              <span className="text-sm font-medium text-slate-700 w-10 text-center">
                {scale.toFixed(1)}×
              </span>
              <button
                onClick={() => adjustScale(0.1)}
                className="h-8 w-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
              >
                <ZoomIn className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>

          <button
            onClick={resetPosition}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset position
          </button>

          <div className="flex-1" />

          <Button onClick={handleGenerate} loading={generating}>
            <Wand2 className="h-4 w-4" />
            {generating ? 'Generating…' : 'Generate Mockup'}
          </Button>
        </div>

        {/* Generated mockup preview */}
        {generatedUrl && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Generated Mockup</p>
            <div className="relative rounded-lg overflow-hidden border border-slate-200" style={{ width: PREVIEW_SIZE / 2, height: PREVIEW_SIZE / 2 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generatedUrl}
                alt="Generated mockup"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="mt-1.5 text-xs text-green-600 font-medium">✓ Mockup saved</p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="text-xs text-slate-400">
        The silver treatment and logo compositing are applied server-side when you click Generate.
        The preview above shows approximate placement only.
      </p>
    </div>
  )
}
