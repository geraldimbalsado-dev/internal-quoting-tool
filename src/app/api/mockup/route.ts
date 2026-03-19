import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateMockup, DEFAULT_MOCKUP_SETTINGS } from '@/lib/mockup'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as {
    quoteItemId: string
    logoPath: string
    logoMimeType: string
    color: string | null
    settings: { x: number; y: number; scale: number }
  }

  const { quoteItemId, logoPath, logoMimeType, color, settings } = body

  if (!quoteItemId || !logoPath) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify ownership and quote status
  const { data: item } = await supabase
    .from('quote_items')
    .select('id, quote_id, quotes!inner(owner_id, status)')
    .eq('id', quoteItemId)
    .single()

  if (!item) {
    return NextResponse.json({ error: 'Quote item not found' }, { status: 404 })
  }

  const quote = (item as unknown as { quotes: { owner_id: string; status: string } }).quotes
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && quote?.owner_id !== user.id) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }
  if (['approved', 'rejected'].includes(quote?.status ?? '')) {
    return NextResponse.json({ error: 'Cannot modify items on an approved or rejected quote' }, { status: 403 })
  }

  // Download logo from storage
  const { data: logoData, error: logoError } = await supabase.storage
    .from('logos')
    .download(logoPath)

  if (logoError || !logoData) {
    console.error('Logo download error:', logoError)
    return NextResponse.json({ error: 'Failed to load logo' }, { status: 500 })
  }

  const logoBuffer = Buffer.from(await logoData.arrayBuffer())

  // Generate mockup
  const effectiveSettings = {
    x: settings?.x ?? DEFAULT_MOCKUP_SETTINGS.x,
    y: settings?.y ?? DEFAULT_MOCKUP_SETTINGS.y,
    scale: settings?.scale ?? DEFAULT_MOCKUP_SETTINGS.scale,
  }

  let mockupBuffer: Buffer
  try {
    mockupBuffer = await generateMockup(logoBuffer, logoMimeType, color, effectiveSettings)
  } catch (err) {
    console.error('Mockup generation error:', err)
    return NextResponse.json({ error: 'Failed to generate mockup' }, { status: 500 })
  }

  // Upload mockup to storage
  const mockupPath = `${user.id}/${quoteItemId}-${Date.now()}.jpg`
  const { error: uploadError } = await supabase.storage
    .from('mockups')
    .upload(mockupPath, mockupBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (uploadError) {
    console.error('Mockup upload error:', uploadError)
    return NextResponse.json({ error: 'Failed to save mockup' }, { status: 500 })
  }

  const { data: { publicUrl: mockupUrl } } = supabase.storage
    .from('mockups')
    .getPublicUrl(mockupPath)

  // Save settings + mockup URL to quote item
  const fullSettings = {
    ...effectiveSettings,
    printAreaX: DEFAULT_MOCKUP_SETTINGS.printAreaX,
    printAreaY: DEFAULT_MOCKUP_SETTINGS.printAreaY,
    printAreaWidth: DEFAULT_MOCKUP_SETTINGS.printAreaWidth,
    printAreaHeight: DEFAULT_MOCKUP_SETTINGS.printAreaHeight,
  }

  const { error: updateError } = await supabase
    .from('quote_items')
    .update({
      mockup_url: mockupUrl,
      mockup_settings: fullSettings,
    })
    .eq('id', quoteItemId)

  if (updateError) {
    console.error('Item update error:', updateError)
    return NextResponse.json({ error: 'Mockup generated but failed to save settings' }, { status: 500 })
  }

  return NextResponse.json({ mockupUrl, settings: fullSettings })
}
