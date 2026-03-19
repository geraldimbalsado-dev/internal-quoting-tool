export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientForm } from '@/components/clients/client-form'
import { DeleteClientButton } from './delete-client-button'
import { updateClientAction } from '@/lib/actions/clients'
import { ChevronLeft, FileText, Plus } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { type Client, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, type QuoteStatus } from '@/types'
import { Button } from '@/components/ui/button'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params
  const profile = await requireAuth()
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  // Ownership check (RLS also enforces, but gives clear 404 vs 403)
  if (profile.role !== 'admin' && client.owner_id !== profile.id) {
    notFound()
  }

  // Client's quotes
  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, quote_number, status, validity_date, created_at, version')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  const updateAction = updateClientAction.bind(null, id)

  return (
    <div className="p-8 max-w-4xl">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Clients
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{client.company_name}</h1>
          <p className="text-slate-500 text-sm mt-0.5">Added {formatDate(client.created_at)}</p>
        </div>
        <DeleteClientButton clientId={id} companyName={client.company_name} />
      </div>

      <div className="grid gap-6">
        {/* Edit form */}
        <Card>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientForm
              client={client as Client}
              action={updateAction}
              submitLabel="Save Changes"
            />
          </CardContent>
        </Card>

        {/* Quotes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Quotes</CardTitle>
              <Link href={`/quotes/new?client=${id}`}>
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  New Quote
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!quotes || quotes.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No quotes yet for this client.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quote</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Version</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Valid Until</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <Link
                          href={`/quotes/${quote.id}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {quote.quote_number}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600">v{quote.version}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${QUOTE_STATUS_COLORS[quote.status as QuoteStatus] ?? ''}`}>
                          {QUOTE_STATUS_LABELS[quote.status as QuoteStatus] ?? quote.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-500">
                        {formatDate(quote.validity_date)}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-500">
                        {formatDate(quote.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
