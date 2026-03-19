'use client'

import { updateQuoteAction } from '@/lib/actions/quotes'
import { QuoteForm } from '@/components/quotes/quote-form'
import { type Quote, type Client } from '@/types'

interface QuoteEditFormProps {
  quote: Quote
  clients: Client[]
}

export function QuoteEditForm({ quote, clients }: QuoteEditFormProps) {
  const action = updateQuoteAction.bind(null, quote.id)
  return (
    <QuoteForm
      quote={quote}
      clients={clients}
      action={action}
      submitLabel="Save Changes"
    />
  )
}
