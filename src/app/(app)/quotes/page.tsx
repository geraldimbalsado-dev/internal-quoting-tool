export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { QuoteStatusBadge } from '@/components/quotes/quote-status-badge'
import { Plus, FileText } from 'lucide-react'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import { type QuoteStatus, type QuoteItem, calcQuoteTotal } from '@/types'

const STATUSES: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'approved', label: 'Approved' },
  { value: 'changes_requested', label: 'Changes' },
  { value: 'rejected', label: 'Rejected' },
]

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function QuotesPage({ searchParams }: PageProps) {
  const profile = await requireAuth()
  const { status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('quotes')
    .select(`
      id,
      quote_number,
      status,
      version,
      validity_date,
      created_at,
      client:clients(company_name, contact_name),
      items:quote_items(unit_price, quantity, discount)
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data: quotes } = await query
  const quoteList = quotes ?? []

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quotes</h1>
          <p className="text-slate-500 mt-0.5 text-sm">
            {quoteList.length} {quoteList.length === 1 ? 'quote' : 'quotes'}
            {status ? ` with status "${status.replace('_', ' ')}"` : ''}
          </p>
        </div>
        <Link href="/quotes/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Quote
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        {STATUSES.map(({ value, label }) => (
          <Link
            key={value}
            href={value ? `/quotes?status=${value}` : '/quotes'}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              (status ?? '') === value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* List */}
      {quoteList.length === 0 ? (
        <Card className="py-16 text-center">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No quotes found</p>
          <p className="text-sm text-slate-400 mt-1">
            <Link href="/quotes/new" className="text-blue-600 hover:underline">
              Create your first quote
            </Link>
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quote</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Valid Until</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {quoteList.map((quote) => {
                const items = (quote.items ?? []) as QuoteItem[]
                const total = calcQuoteTotal(items)
                const client = quote.client as unknown as { company_name: string; contact_name: string } | null

                return (
                  <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/quotes/${quote.id}`} className="font-medium text-blue-600 hover:underline text-sm">
                        {quote.quote_number}
                      </Link>
                      <span className="ml-2 text-xs text-slate-400">v{quote.version}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900">{client?.company_name ?? '—'}</p>
                      <p className="text-xs text-slate-400">{client?.contact_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <QuoteStatusBadge status={quote.status as QuoteStatus} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                      {items.length > 0 ? formatCurrency(total) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(quote.validity_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(quote.created_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
