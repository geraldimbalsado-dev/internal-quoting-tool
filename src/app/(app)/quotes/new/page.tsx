export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createQuoteAction } from '@/lib/actions/quotes'
import { QuoteForm } from '@/components/quotes/quote-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { type Client } from '@/types'

interface PageProps {
  searchParams: Promise<{ client?: string }>
}

export default async function NewQuotePage({ searchParams }: PageProps) {
  const profile = await requireAuth()
  const { client: defaultClientId } = await searchParams
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name, contact_name, email, phone, owner_id, created_at, updated_at')
    .order('company_name')

  return (
    <div className="p-8 max-w-2xl">
      <Link
        href="/quotes"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Quotes
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>New Quote</CardTitle>
        </CardHeader>
        <CardContent>
          <QuoteForm
            clients={(clients ?? []) as Client[]}
            defaultClientId={defaultClientId}
            action={createQuoteAction}
            submitLabel="Create Quote"
          />
        </CardContent>
      </Card>
    </div>
  )
}
