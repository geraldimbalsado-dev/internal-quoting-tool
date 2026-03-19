/**
 * Server-side mockup generation using Sharp.
 * - Applies silver treatment to uploaded logo
 * - Composites onto a programmatically generated product template
 * - Print area is fixed and centered
 */

import sharp from 'sharp'
import {
  TEMPLATE_W,
  TEMPLATE_H,
  PRINT_AREA,
  DEFAULT_MOCKUP_SETTINGS,
} from './mockup-constants'

export { TEMPLATE_W, TEMPLATE_H, PRINT_AREA, DEFAULT_MOCKUP_SETTINGS }

// Parse color name → RGB background for the product template
function colorNameToRgb(colorName: string | null): { r: number; g: number; b: number } {
  const map: Record<string, { r: number; g: number; b: number }> = {
    white: { r: 240, g: 240, b: 238 },
    black: { r: 40, g: 40, b: 42 },
    navy: { r: 28, g: 40, b: 80 },
    red: { r: 180, g: 30, b: 30 },
    'royal blue': { r: 35, g: 70, b: 170 },
    'forest green': { r: 30, g: 90, b: 45 },
    'heather gray': { r: 160, g: 162, b: 166 },
    maroon: { r: 110, g: 20, b: 35 },
    charcoal: { r: 70, g: 70, b: 74 },
    khaki: { r: 190, g: 175, b: 140 },
    silver: { r: 185, g: 185, b: 192 },
    gold: { r: 190, g: 160, b: 60 },
    yellow: { r: 230, g: 210, b: 40 },
    natural: { r: 225, g: 215, b: 195 },
    gray: { r: 145, g: 145, b: 150 },
    pink: { r: 220, g: 140, b: 165 },
    'rose gold': { r: 200, g: 155, b: 140 },
    blue: { r: 40, g: 80, b: 180 },
    green: { r: 40, g: 130, b: 55 },
  }
  const key = (colorName ?? '').toLowerCase()
  return map[key] ?? { r: 220, g: 218, b: 215 }
}

/**
 * Generate a product template PNG buffer.
 * Creates a solid background with a subtle print area indicator.
 */
export async function generateProductTemplate(colorName: string | null): Promise<Buffer> {
  const bg = colorNameToRgb(colorName)

  // Determine if background is dark to choose contrasting elements
  const luminance = 0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b
  const isDark = luminance < 128
  const lineColor = isDark
    ? 'rgba(255,255,255,0.15)'
    : 'rgba(0,0,0,0.10)'
  const textColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)'

  const { x, y, width, height } = PRINT_AREA

  const svg = `
    <svg width="${TEMPLATE_W}" height="${TEMPLATE_H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${TEMPLATE_W}" height="${TEMPLATE_H}" fill="rgb(${bg.r},${bg.g},${bg.b})"/>
      <!-- Subtle product shape hint (rounded rectangle) -->
      <rect x="80" y="80" width="${TEMPLATE_W - 160}" height="${TEMPLATE_H - 160}"
        rx="40" fill="none" stroke="${lineColor}" stroke-width="1.5"/>
      <!-- Print area dashed border -->
      <rect x="${x}" y="${y}" width="${width}" height="${height}"
        rx="6" fill="none"
        stroke="${lineColor}" stroke-width="1.5" stroke-dasharray="8 5"/>
      <!-- "PRINT AREA" label -->
      <text x="${x + width / 2}" y="${y + height / 2}"
        text-anchor="middle" dominant-baseline="middle"
        font-family="system-ui, sans-serif" font-size="13" letter-spacing="3"
        fill="${textColor}" font-weight="500">PRINT AREA</text>
    </svg>
  `

  return sharp(Buffer.from(svg)).png().toBuffer()
}

/**
 * Apply silver treatment to a logo image buffer.
 * 1. Flatten any transparency to white
 * 2. Desaturate to grayscale
 * 3. Boost contrast for a metallic look
 * 4. Apply a very slight cool tint (silver = slightly blue-gray)
 * Returns PNG with transparency preserved.
 */
export async function applySilverTreatment(
  inputBuffer: Buffer,
  mimeType: string
): Promise<Buffer> {
  let pipeline = sharp(inputBuffer)

  // For SVG, rasterize first
  if (mimeType === 'image/svg+xml') {
    pipeline = sharp(await pipeline.png().toBuffer())
  }

  const meta = await pipeline.metadata()
  const hasAlpha = meta.hasAlpha ?? false

  // Extract alpha channel before treatment if present
  let alphaBuffer: Buffer | null = null
  if (hasAlpha) {
    alphaBuffer = await sharp(inputBuffer)
      .extractChannel('alpha')
      .toBuffer()
  }

  // Apply silver treatment to RGB channels
  const silvered = await pipeline
    .flatten({ background: { r: 255, g: 255, b: 255 } }) // remove alpha for processing
    .grayscale()
    // Boost contrast: linear levels adjustment
    .linear(1.25, -20)
    // Tint toward silver (slight blue-white): apply a very subtle tint
    // by blending with a silver tone using modulate
    .modulate({ brightness: 1.05, saturation: 0.08, hue: 210 })
    .toBuffer()

  // Re-apply original alpha channel if there was one
  if (alphaBuffer && hasAlpha) {
    return sharp(silvered)
      .joinChannel(alphaBuffer)
      .png()
      .toBuffer()
  }

  // For opaque images, attempt white background removal:
  // Any pixel close to white (R>240 G>240 B>240) becomes transparent
  const { data, info } = await sharp(silvered)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const pixels = new Uint8Array(data.buffer)
  const width = info.width
  const height = info.height
  const channels = info.channels as number // 3 for RGB

  // Create RGBA output
  const rgbaData = new Uint8Array(width * height * 4)

  for (let i = 0; i < width * height; i++) {
    const r = pixels[i * channels]
    const g = pixels[i * channels + 1]
    const b = pixels[i * channels + 2]

    rgbaData[i * 4] = r
    rgbaData[i * 4 + 1] = g
    rgbaData[i * 4 + 2] = b

    // White-ish pixels → transparent; non-white → opaque
    const brightness = (r + g + b) / 3
    rgbaData[i * 4 + 3] = brightness > 235 ? 0 : 255
  }

  return sharp(rgbaData, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer()
}

/**
 * Generate final mockup: composite silver logo onto product template.
 * Settings: { x, y, scale } where x/y are center of logo in template coords.
 */
export async function generateMockup(
  logoBuffer: Buffer,
  logoMimeType: string,
  colorName: string | null,
  settings: { x: number; y: number; scale: number }
): Promise<Buffer> {
  // 1. Generate product template
  const templateBuffer = await generateProductTemplate(colorName)

  // 2. Apply silver treatment to logo
  const silveredLogo = await applySilverTreatment(logoBuffer, logoMimeType)

  // 3. Compute logo size — fit within print area at given scale
  const maxLogoW = PRINT_AREA.width * 0.9
  const maxLogoH = PRINT_AREA.height * 0.9
  const logoMeta = await sharp(silveredLogo).metadata()
  const origW = logoMeta.width ?? 200
  const origH = logoMeta.height ?? 200

  // Fit to print area, then apply scale
  const fitScale = Math.min(maxLogoW / origW, maxLogoH / origH)
  const finalScale = fitScale * Math.max(0.1, Math.min(3, settings.scale))
  const logoW = Math.round(origW * finalScale)
  const logoH = Math.round(origH * finalScale)

  // Clamp position so logo stays within template bounds
  const clampedX = Math.max(logoW / 2, Math.min(TEMPLATE_W - logoW / 2, settings.x))
  const clampedY = Math.max(logoH / 2, Math.min(TEMPLATE_H - logoH / 2, settings.y))

  // Top-left position for composite
  const left = Math.round(clampedX - logoW / 2)
  const top = Math.round(clampedY - logoH / 2)

  // 4. Resize silver logo
  const resizedLogo = await sharp(silveredLogo)
    .resize(logoW, logoH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  // 5. Composite
  return sharp(templateBuffer)
    .composite([{ input: resizedLogo, left, top, blend: 'over' }])
    .jpeg({ quality: 88 })
    .toBuffer()
}
