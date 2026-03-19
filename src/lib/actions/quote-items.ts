'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const itemSchema = z.object({
  product_id: z.string().uuid('Please select a product'),
  size: z.string().max(50).optional().or(z.literal('')),
  color: z.string().max(50).optional().or(z.literal('')),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unit_price: z.coerce.number().min(0, 'Price must be 0 or more'),
  discount: z.coerce.number().min(0).max(100, 'Discount must be 0–100'),
  lead_time: z.string().max(100).optional().or(z.literal('')),
})

async function assertQuoteOwnership(quoteId: string) {
  const profile = await requireAuth()
  const supabase = await createClient()

  const { data: quote } = await supabase
    .from('quotes')
    .select('owner_id, status')
    .eq('id', quoteId)
    .single()

  if (!quote) return { error: 'Quote not found.', supabase: null, profile: null }
  if (profile.role !== 'admin' && quote.owner_id !== profile.id) {
    return { error: 'Permission denied.', supabase: null, profile: null }
  }
  if (['approved', 'rejected'].includes(quote.status)) {
    return { error: 'Cannot edit items on an approved or rejected quote.', supabase: null, profile: null }
  }

  return { error: null, supabase, profile }
}

export async function addQuoteItemAction(quoteId: string, formData: FormData) {
  const { error, supabase } = await assertQuoteOwnership(quoteId)
  if (error || !supabase) return { error }

  const raw = {
    product_id: formData.get('product_id') as string,
    size: formData.get('size') as string,
    color: formData.get('color') as string,
    quantity: formData.get('quantity') as string,
    unit_price: formData.get('unit_price') as string,
    discount: formData.get('discount') as string,
    lead_time: formData.get('lead_time') as string,
  }

  const parsed = itemSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Get current max sort_order
  const { data: existing } = await supabase
    .from('quote_items')
    .select('sort_order')
    .eq('quote_id', quoteId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { error: insertError } = await supabase.from('quote_items').insert({
    quote_id: quoteId,
    product_id: parsed.data.product_id,
    size: parsed.data.size || null,
    color: parsed.data.color || null,
    quantity: parsed.data.quantity,
    unit_price: parsed.data.unit_price,
    discount: parsed.data.discount,
    lead_time: parsed.data.lead_time || null,
    sort_order: nextOrder,
  })

  if (insertError) {
    console.error('addQuoteItem error:', insertError)
    return { error: 'Failed to add item.' }
  }

  revalidatePath(`/quotes/${quoteId}`)
}

export async function updateQuoteItemAction(
  quoteId: string,
  itemId: string,
  formData: FormData
) {
  const { error, supabase } = await assertQuoteOwnership(quoteId)
  if (error || !supabase) return { error }

  const raw = {
    product_id: formData.get('product_id') as string,
    size: formData.get('size') as string,
    color: formData.get('color') as string,
    quantity: formData.get('quantity') as string,
    unit_price: formData.get('unit_price') as string,
    discount: formData.get('discount') as string,
    lead_time: formData.get('lead_time') as string,
  }

  const parsed = itemSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error: updateError } = await supabase
    .from('quote_items')
    .update({
      product_id: parsed.data.product_id,
      size: parsed.data.size || null,
      color: parsed.data.color || null,
      quantity: parsed.data.quantity,
      unit_price: parsed.data.unit_price,
      discount: parsed.data.discount,
      lead_time: parsed.data.lead_time || null,
    })
    .eq('id', itemId)
    .eq('quote_id', quoteId)

  if (updateError) return { error: 'Failed to update item.' }

  revalidatePath(`/quotes/${quoteId}`)
}

export async function deleteQuoteItemAction(quoteId: string, itemId: string) {
  const { error, supabase } = await assertQuoteOwnership(quoteId)
  if (error || !supabase) return { error }

  const { error: deleteError } = await supabase
    .from('quote_items')
    .delete()
    .eq('id', itemId)
    .eq('quote_id', quoteId)

  if (deleteError) return { error: 'Failed to remove item.' }

  revalidatePath(`/quotes/${quoteId}`)
}
