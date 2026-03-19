import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { type QuoteItem } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { QuotePdf, type PdfQuoteItem } from '@/components/pdf/quote-pdf'

export const dynamic = 'force-dynamic'

async function fetchAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const contentType = res.headers.get('content-type') ?? 'image/png'
    return `data:${contentType};base64,${base64}`
  } catch {
    return null
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let profile
  try {
    profile = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: quote } = await supabase
    .from('quotes')
    .select(`
      id, quote_number, version, status, created_at, validity_date, notes, owner_id,
      client:clients(company_name, contact_name, email),
      owner:profiles(full_name, email),
      items:quote_items(
        id, product_id, size, color, quantity, unit_price, discount, lead_time,
        mockup_url, mockup_settings,
        product:products(name)
      )
    `)
    .eq('id', id)
    .single()

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found.' }, { status: 404 })
  }

  if (profile.role !== 'admin' && quote.owner_id !== profile.id) {
    return NextResponse.json({ error: 'Permission denied.' }, { status: 403 })
  }

  const client = quote.client as unknown as {
    company_name: string
    contact_name: string
    email: string
  } | null

  const owner = quote.owner as unknown as {
    full_name: string | null
    email: string
  } | null

  const rawItems = (quote.items as unknown as Array<
    QuoteItem & { product: { name: string } | null; mockup_url: string | null }
  >) ?? []

  // Fetch mockup images as base64 in parallel
  const pdfItems: PdfQuoteItem[] = await Promise.all(
    rawItems.map(async (item) => {
      let mockupDataUrl: string | null = null
      if (item.mockup_url) {
        mockupDataUrl = await fetchAsBase64(item.mockup_url)
      }
      return {
        ...item,
        productName: item.product?.name ?? 'Unknown Product',
        mockupDataUrl,
      }
    })
  )

  const generatedAt = formatDateTime(new Date().toISOString())

  const pdfElement = createElement(QuotePdf, {
    quoteNumber: quote.quote_number,
    version: quote.version,
    status: quote.status,
    clientCompany: client?.company_name ?? '',
    clientContact: client?.contact_name ?? '',
    clientEmail: client?.email ?? '',
    ownerName: owner?.full_name ?? owner?.email ?? '',
    createdAt: quote.created_at,
    validityDate: quote.validity_date ?? null,
    notes: quote.notes ?? null,
    items: pdfItems,
    generatedAt,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(pdfElement as any)

  const filename = `${quote.quote_number}.pdf`
  const uint8 = new Uint8Array(pdfBuffer)

  return new NextResponse(uint8, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(uint8.byteLength),
    },
  })
}
