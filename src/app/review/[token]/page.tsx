import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { ReviewForm } from './review-form'
import { logQuoteOpenedAction } from '@/lib/actions/review'
import { formatCurrency, formatDate } from '@/lib/utils'
import { type QuoteItem, type Product, calcLineTotal, calcQuoteTotal, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, type QuoteStatus } from '@/types'
import { Briefcase, Calendar, FileText, Package } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function ReviewPage({ params }: PageProps) {
  const { token } = await params

  if (!token || token.length < 20) notFound()

  const supabase = await createServiceClient()

  const { data: quote } = await supabase
    .from('quotes')
    .select(`
      id, quote_number, status, version, validity_date, notes, created_at,
      client:clients(company_name, contact_name, email),
      items:quote_items(
        id, product_id, size, color, quantity, unit_price, discount,
        lead_time, mockup_url, sort_order,
        product:products(name, description, category)
      )
    `)
    .eq('public_token', token)
    .order('sort_order', { referencedTable: 'quote_items', ascending: true })
    .single()

  if (!quote) notFound()

  // Log the open event (fire-and-forget)
  logQuoteOpenedAction(quote.id)

  const items = (quote.items ?? []) as unknown as QuoteItem[]
  const total = calcQuoteTotal(items)
  const client = quote.client as unknown as { company_name: string; contact_name: string; email: string } | null
  const canRespond = ['sent', 'changes_requested'].includes(quote.status)

  const statusColor = QUOTE_STATUS_COLORS[quote.status as QuoteStatus] ?? 'bg-slate-100 text-slate-600'
  const statusLabel = QUOTE_STATUS_LABELS[quote.status as QuoteStatus] ?? quote.status

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-slate-900">QuoteTool</span>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Quote header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Quote for</p>
              <h1 className="text-2xl font-bold text-slate-900">{client?.company_name}</h1>
              <p className="text-slate-500 text-sm mt-0.5">{client?.contact_name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-slate-400">Reference</p>
              <p className="font-mono text-sm font-semibold text-slate-700">{quote.quote_number}</p>
              <p className="text-xs text-slate-400 mt-0.5">v{quote.version}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-600 pt-4 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              Issued {formatDate(quote.created_at)}
            </span>
            {quote.validity_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                Valid until {formatDate(quote.validity_date)}
              </span>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-400" />
              Products &amp; Pricing
            </h2>
          </div>

          {items.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400 text-sm">
              No items on this quote yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {items.map((item) => {
                const product = item.product as unknown as Product | null
                const lineTotal = calcLineTotal(item)

                return (
                  <div key={item.id} className="px-6 py-5">
                    <div className="flex gap-4">
                      {/* Mockup image */}
                      {item.mockup_url && (
                        <div className="shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.mockup_url}
                            alt={`${product?.name ?? 'Product'} mockup`}
                            className="h-24 w-24 rounded-xl object-cover border border-slate-100"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-slate-900">{product?.name ?? 'Product'}</h3>
                            {product?.description && (
                              <p className="text-sm text-slate-500 mt-0.5">{product.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.size && (
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                  Size: {item.size}
                                </span>
                              )}
                              {item.color && (
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                  Color: {item.color}
                                </span>
                              )}
                              {item.lead_time && (
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                  Lead time: {item.lead_time}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-slate-900 text-lg">{formatCurrency(lineTotal)}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {item.quantity} × {formatCurrency(item.unit_price)}
                              {item.discount > 0 && ` − ${item.discount}%`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Total */}
          {items.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">Total</span>
              <span className="text-xl font-bold text-slate-900">{formatCurrency(total)}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-slate-400" />
              Notes
            </h2>
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{quote.notes}</p>
          </div>
        )}

        {/* Response form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-1">Your Response</h2>
          {canRespond ? (
            <p className="text-sm text-slate-500 mb-5">
              Please review the quote above and let us know how you&apos;d like to proceed.
            </p>
          ) : (
            <p className="text-sm text-slate-500 mb-5">
              This quote has already been responded to.
            </p>
          )}
          <ReviewForm token={token} currentStatus={quote.status} />
        </div>

        <p className="text-center text-xs text-slate-400 pb-4">
          Powered by QuoteTool · {quote.quote_number}
        </p>
      </main>
    </div>
  )
}
