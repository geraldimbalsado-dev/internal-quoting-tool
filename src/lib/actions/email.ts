'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { sendQuoteEmail } from '@/lib/email'
import { formatDate } from '@/lib/utils'

export async function sendQuoteToClientAction(quoteId: string) {
  const profile = await requireAuth()
  const supabase = await createClient()

  // Load quote with client info and item count
  const { data: quote } = await supabase
    .from('quotes')
    .select(`
      id, quote_number, version, status, validity_date, public_token, owner_id, client_id,
      client:clients(company_name, contact_name, email),
      items:quote_items(id)
    `)
    .eq('id', quoteId)
    .single()

  if (!quote) return { error: 'Quote not found.' }
  if (profile.role !== 'admin' && quote.owner_id !== profile.id) {
    return { error: 'Permission denied.' }
  }
  if (quote.status === 'approved' || quote.status === 'rejected') {
    return { error: 'Cannot send an approved or rejected quote.' }
  }

  const client = quote.client as unknown as {
    company_name: string
    contact_name: string
    email: string
  } | null

  if (!client?.email) return { error: 'Client has no email address.' }

  const isResend = quote.status === 'sent'
  const itemCount = Array.isArray(quote.items) ? quote.items.length : 0

  try {
    await sendQuoteEmail({
      to: client.email,
      clientName: client.contact_name,
      companyName: client.company_name,
      senderName: profile.full_name ?? profile.email,
      quoteNumber: quote.quote_number,
      version: quote.version,
      validityDate: quote.validity_date ? formatDate(quote.validity_date) : null,
      itemCount,
      token: quote.public_token,
      isResend,
    })
  } catch {
    return { error: 'Failed to send email. Please check your email configuration.' }
  }

  // Mark as sent
  await supabase
    .from('quotes')
    .update({ status: 'sent' })
    .eq('id', quoteId)

  // Log activity
  await supabase.from('activity_logs').insert({
    quote_id: quoteId,
    user_id: profile.id,
    event_type: 'email_sent',
    metadata: {
      to: client.email,
      quote_number: quote.quote_number,
      version: quote.version,
      is_resend: isResend,
    },
  })

  revalidatePath(`/quotes/${quoteId}`)
  revalidatePath('/quotes')
  return { success: true }
}
