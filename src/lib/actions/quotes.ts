'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const quoteSchema = z.object({
  client_id: z.string().uuid('Please select a client'),
  validity_date: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

export async function createQuoteAction(formData: FormData) {
  const profile = await requireAuth()

  const raw = {
    client_id: formData.get('client_id') as string,
    validity_date: formData.get('validity_date') as string,
    notes: formData.get('notes') as string,
  }

  const parsed = quoteSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  // Verify client belongs to this user (or is admin)
  const { data: client } = await supabase
    .from('clients')
    .select('id, owner_id')
    .eq('id', parsed.data.client_id)
    .single()

  if (!client) return { error: 'Client not found.' }
  if (profile.role !== 'admin' && client.owner_id !== profile.id) {
    return { error: 'You do not have access to this client.' }
  }

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      client_id: parsed.data.client_id,
      owner_id: profile.id,
      status: 'draft',
      validity_date: parsed.data.validity_date || null,
      notes: parsed.data.notes || null,
      version: 1,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createQuote error:', error)
    return { error: 'Failed to create quote. Please try again.' }
  }

  await supabase.from('activity_logs').insert({
    quote_id: data.id,
    user_id: profile.id,
    event_type: 'quote_created',
    metadata: {},
  })

  revalidatePath('/quotes')
  redirect(`/quotes/${data.id}`)
}

export async function updateQuoteAction(id: string, formData: FormData) {
  const profile = await requireAuth()

  const raw = {
    client_id: formData.get('client_id') as string,
    validity_date: formData.get('validity_date') as string,
    notes: formData.get('notes') as string,
  }

  const parsed = quoteSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('quotes')
    .select('owner_id, status')
    .eq('id', id)
    .single()

  if (!existing) return { error: 'Quote not found.' }
  if (profile.role !== 'admin' && existing.owner_id !== profile.id) {
    return { error: 'You do not have permission to edit this quote.' }
  }

  // Don't allow editing approved/rejected quotes
  if (['approved', 'rejected'].includes(existing.status)) {
    return { error: 'Approved or rejected quotes cannot be edited. Create a new version instead.' }
  }

  // Verify client ownership
  const { data: client } = await supabase
    .from('clients')
    .select('id, owner_id')
    .eq('id', parsed.data.client_id)
    .single()

  if (!client) return { error: 'Client not found.' }
  if (profile.role !== 'admin' && client.owner_id !== profile.id) {
    return { error: 'You do not have access to this client.' }
  }

  const { error } = await supabase
    .from('quotes')
    .update({
      client_id: parsed.data.client_id,
      validity_date: parsed.data.validity_date || null,
      notes: parsed.data.notes || null,
    })
    .eq('id', id)

  if (error) {
    console.error('updateQuote error:', error)
    return { error: 'Failed to update quote. Please try again.' }
  }

  revalidatePath('/quotes')
  revalidatePath(`/quotes/${id}`)
  redirect(`/quotes/${id}`)
}

export async function updateQuoteStatusAction(
  id: string,
  status: string
) {
  const profile = await requireAuth()
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('quotes')
    .select('owner_id, status')
    .eq('id', id)
    .single()

  if (!existing) return { error: 'Quote not found.' }
  if (profile.role !== 'admin' && existing.owner_id !== profile.id) {
    return { error: 'Permission denied.' }
  }

  // Approved/rejected quotes are immutable — create a new version instead
  if (['approved', 'rejected'].includes(existing.status)) {
    return { error: 'Approved or rejected quotes cannot be modified. Create a new version instead.' }
  }

  const allowed = ['draft', 'sent', 'approved', 'changes_requested', 'rejected']
  if (!allowed.includes(status)) return { error: 'Invalid status.' }

  const { error } = await supabase
    .from('quotes')
    .update({ status })
    .eq('id', id)

  if (error) return { error: 'Failed to update status.' }

  await supabase.from('activity_logs').insert({
    quote_id: id,
    user_id: profile.id,
    event_type: 'quote_updated',
    metadata: { field: 'status', new_status: status, previous_status: existing.status },
  })

  revalidatePath(`/quotes/${id}`)
  revalidatePath('/quotes')
}

export async function createQuoteVersionAction(id: string) {
  const profile = await requireAuth()
  const supabase = await createClient()

  // Load the current quote with its items
  const { data: source } = await supabase
    .from('quotes')
    .select(`
      *,
      items:quote_items(
        product_id, size, color, quantity, unit_price, discount,
        lead_time, mockup_settings, mockup_url, sort_order
      )
    `)
    .eq('id', id)
    .single()

  if (!source) return { error: 'Quote not found.' }
  if (profile.role !== 'admin' && source.owner_id !== profile.id) {
    return { error: 'Permission denied.' }
  }

  // Find the root quote (the v1 with no parent)
  const rootId = source.parent_quote_id ?? source.id
  const rootNumber = source.parent_quote_id
    ? source.quote_number.replace(/-v\d+$/, '')  // strip existing -vN suffix
    : source.quote_number

  // Count all existing versions of this quote family
  const { count } = await supabase
    .from('quotes')
    .select('id', { count: 'exact', head: true })
    .or(`id.eq.${rootId},parent_quote_id.eq.${rootId}`)

  const newVersion = (count ?? 1) + 1
  const newQuoteNumber = `${rootNumber}-v${newVersion}`

  // Insert new quote
  const { data: newQuote, error: insertError } = await supabase
    .from('quotes')
    .insert({
      quote_number: newQuoteNumber,
      client_id: source.client_id,
      owner_id: profile.id,
      status: 'draft',
      validity_date: source.validity_date,
      notes: source.notes,
      version: newVersion,
      parent_quote_id: rootId,
    })
    .select('id')
    .single()

  if (insertError || !newQuote) {
    console.error('createVersion insert error:', insertError)
    // Unique constraint violation — another version was created simultaneously
    if (insertError?.code === '23505') {
      return { error: 'A new version was just created. Please refresh and try again.' }
    }
    return { error: 'Failed to create new version.' }
  }

  // Clone items
  const items = (source.items ?? []) as Array<{
    product_id: string
    size: string | null
    color: string | null
    quantity: number
    unit_price: number
    discount: number
    lead_time: string | null
    mockup_settings: unknown
    mockup_url: string | null
    sort_order: number
  }>

  if (items.length > 0) {
    const clonedItems = items.map((item) => ({
      quote_id: newQuote.id,
      product_id: item.product_id,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
      lead_time: item.lead_time,
      mockup_settings: item.mockup_settings,
      mockup_url: item.mockup_url,
      sort_order: item.sort_order,
    }))

    const { error: itemsError } = await supabase.from('quote_items').insert(clonedItems)
    if (itemsError) {
      console.error('clone items error:', itemsError)
      // Quote was created — clean up and report error
      await supabase.from('quotes').delete().eq('id', newQuote.id)
      return { error: 'Failed to clone quote items.' }
    }
  }

  await supabase.from('activity_logs').insert({
    quote_id: newQuote.id,
    user_id: profile.id,
    event_type: 'version_created',
    metadata: { new_version: newVersion, source_quote_id: id },
  })

  revalidatePath('/quotes')
  revalidatePath(`/quotes/${id}`)
  redirect(`/quotes/${newQuote.id}`)
}

export async function deleteQuoteAction(id: string) {
  const profile = await requireAuth()
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('quotes')
    .select('owner_id, quote_number, status')
    .eq('id', id)
    .single()

  if (!existing) return { error: 'Quote not found.' }
  if (profile.role !== 'admin' && existing.owner_id !== profile.id) {
    return { error: 'Permission denied.' }
  }
  if (existing.status !== 'draft') {
    return { error: 'Only draft quotes can be deleted.' }
  }

  const { error } = await supabase.from('quotes').delete().eq('id', id)
  if (error) return { error: 'Failed to delete quote.' }

  revalidatePath('/quotes')
  redirect('/quotes')
}
