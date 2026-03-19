export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuoteStatusBadge } from '@/components/quotes/quote-status-badge'
import { QuoteStatusActions } from './quote-status-actions'
import { DeleteQuoteButton } from './delete-quote-button'
import { QuoteEditForm } from './quote-edit-form'
import { formatDate, formatCurrency } from '@/lib/utils'
import { type Quote, type Client, type QuoteItem, type QuoteStatus, type Product, calcQuoteTotal } from '@/types'
import { QuoteItemsEditor } from '@/components/quotes/quote-items-editor'
import { VersionHistory } from '@/components/quotes/version-history'
import { ActivityTimeline } from '@/components/quotes/activity-log'
import { type ActivityLog } from '@/types'
import { ChevronLeft, FileDown } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function QuoteDetailPage({ params }: PageProps) {
  const { id } = await params
  const profile = await requireAuth()
  const supabase = await createClient()

  const { data: quote } = await supabase
    .from('quotes')
    .select(`
      *,
      client:clients(id, company_name, contact_name, email, phone, owner_id, created_at, updated_at),
      owner:profiles(id, email, full_name, role, created_at),
      items:quote_items(
        id, quote_id, product_id, size, color, quantity, unit_price, discount,
        lead_time, mockup_settings, mockup_url, sort_order, created_at,
        product:products(id, name, description, category, base_price, image_url, available_sizes, available_colors, created_at)
      )
    `)
    .eq('id', id)
    .order('sort_order', { referencedTable: 'quote_items', ascending: true })
    .single()

  if (!quote) notFound()

  if (profile.role !== 'admin' && quote.owner_id !== profile.id) {
    notFound()
  }

  const items = (quote.items ?? []) as QuoteItem[]
  const total = calcQuoteTotal(items)
  const canEdit = !['approved', 'rejected'].includes(quote.status)

  // Fetch clients for edit form
  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name, contact_name, email, phone, owner_id, created_at, updated_at')
    .order('company_name')

  // Fetch active products for item editor
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('name')

  // Fetch all versions of this quote family
  const rootId = quote.parent_quote_id ?? quote.id
  const { data: allVersions } = await supabase
    .from('quotes')
    .select('id, quote_number, version, status, created_at, validity_date')
    .or(`id.eq.${rootId},parent_quote_id.eq.${rootId}`)
    .order('version', { ascending: true })

  const { data: activityLogs } = await supabase
    .from('activity_logs')
    .select('*, user:profiles(id, email, full_name, role, created_at)')
    .eq('quote_id', id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-8 max-w-5xl">
      {/* Back */}
      <Link
        href="/quotes"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Quotes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">{quote.quote_number}</h1>
            <span className="text-slate-400 text-sm font-normal">v{quote.version}</span>
            <QuoteStatusBadge status={quote.status as QuoteStatus} />
          </div>
          <p className="text-slate-500 text-sm">
            For{' '}
            <Link href={`/clients/${quote.client_id}`} className="text-blue-600 hover:underline font-medium">
              {(quote.client as unknown as Client)?.company_name}
            </Link>
            {' · '}Created {formatDate(quote.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`/api/pdf/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
          >
            <FileDown className="h-3.5 w-3.5" />
            Export PDF
          </a>
          <DeleteQuoteButton quoteId={id} quoteNumber={quote.quote_number} canDelete={quote.status === 'draft'} />
        </div>
      </div>

      <div className="grid gap-6">
        {/* Status actions */}
        <QuoteStatusActions
          quoteId={id}
          currentStatus={quote.status as QuoteStatus}
          publicToken={quote.public_token}
        />

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Quote Total</p>
            <p className="text-xl font-bold text-slate-900">
              {items.length > 0 ? formatCurrency(total) : <span className="text-slate-400 text-base font-medium">No items yet</span>}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Items</p>
            <p className="text-xl font-bold text-slate-900">{items.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Valid Until</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{formatDate(quote.validity_date)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Assigned To</p>
            <p className="text-sm font-semibold text-slate-900 mt-1 truncate">
              {(quote.owner as { full_name: string | null } | null)?.full_name ?? 'Unknown'}
            </p>
          </div>
        </div>

        {/* Quote details edit */}
        {canEdit && (
          <Card>
            <CardHeader>
              <CardTitle>Quote Details</CardTitle>
            </CardHeader>
            <CardContent>
              <QuoteEditForm
                quote={quote as unknown as Quote}
                clients={(clients ?? []) as Client[]}
              />
            </CardContent>
          </Card>
        )}

        {!canEdit && (
          <Card>
            <CardHeader>
              <CardTitle>Quote Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500 mb-0.5">Client</dt>
                  <dd className="font-medium text-slate-900">
                    {(quote.client as unknown as Client)?.company_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 mb-0.5">Valid Until</dt>
                  <dd className="font-medium text-slate-900">{formatDate(quote.validity_date)}</dd>
                </div>
                {quote.notes && (
                  <div className="sm:col-span-2">
                    <dt className="text-slate-500 mb-0.5">Notes</dt>
                    <dd className="text-slate-700 whitespace-pre-wrap">{quote.notes}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <QuoteItemsEditor
              quoteId={id}
              items={items}
              products={(products ?? []) as Product[]}
              canEdit={canEdit}
            />
          </CardContent>
        </Card>

        {/* Version History */}
        <Card>
          <CardHeader>
            <CardTitle>Version History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <VersionHistory
              currentQuoteId={id}
              versions={allVersions ?? []}
              canCreateVersion={true}
            />
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ActivityTimeline logs={(activityLogs ?? []) as ActivityLog[]} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
