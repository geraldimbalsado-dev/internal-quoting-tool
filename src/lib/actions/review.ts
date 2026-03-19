'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { sendClientResponseNotification } from '@/lib/email'

export async function logQuoteOpenedAction(quoteId: string) {
  // Best-effort — don't fail the page if this errors
  try {
    const supabase = await createServiceClient()
    await supabase.from('activity_logs').insert({
      quote_id: quoteId,
      event_type: 'quote_opened',
      metadata: { source: 'client_review' },
    })
  } catch {
    // silent
  }
}

export async function submitClientReviewAction(
  token: string,
  formData: FormData
) {
  const action = formData.get('action') as string
  const comment = (formData.get('comment') as string)?.trim() || null

  const validActions = ['approved', 'changes_requested', 'rejected']
  if (!validActions.includes(action)) {
    return { error: 'Invalid action.' }
  }

  const supabase = await createServiceClient()

  // Look up quote by token — include data needed for notification
  const { data: quote } = await supabase
    .from('quotes')
    .select(`
      id, status, owner_id, quote_number,
      client:clients(contact_name, company_name),
      owner:profiles(email, full_name)
    `)
    .eq('public_token', token)
    .single()

  if (!quote) return { error: 'Quote not found.' }

  // Only allow responses on sent or changes_requested quotes
  if (!['sent', 'changes_requested'].includes(quote.status)) {
    return { error: 'This quote is not awaiting a response.' }
  }

  // Update status
  const { error: updateError } = await supabase
    .from('quotes')
    .update({ status: action })
    .eq('id', quote.id)

  if (updateError) {
    console.error('review status update error:', updateError)
    return { error: 'Failed to submit response. Please try again.' }
  }

  // Log activity
  const eventMap: Record<string, string> = {
    approved: 'quote_approved',
    rejected: 'quote_rejected',
    changes_requested: 'quote_changes_requested',
  }

  await supabase.from('activity_logs').insert({
    quote_id: quote.id,
    event_type: eventMap[action],
    metadata: { comment, source: 'client_review', action },
  })

  // Send notification email to sales user (best-effort)
  try {
    const owner = quote.owner as unknown as { email: string; full_name: string | null } | null
    const client = quote.client as unknown as { contact_name: string; company_name: string } | null

    if (owner?.email && client) {
      await sendClientResponseNotification({
        to: owner.email,
        salesName: owner.full_name ?? owner.email,
        clientName: client.contact_name,
        clientCompany: client.company_name,
        quoteNumber: quote.quote_number,
        quoteId: quote.id,
        action,
        comment,
      })
    }
  } catch (err) {
    // Don't fail the review submission if notification email fails
    console.error('notification email failed:', err)
  }

  return { success: true, action }
}
