export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Search, Building2, Phone, Mail } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ClientSortSelect } from '@/components/clients/client-sort-select'

interface PageProps {
  searchParams: Promise<{ q?: string; sort?: string }>
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const profile = await requireAuth()
  const { q, sort = 'newest' } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('clients')
    .select('id, company_name, contact_name, email, phone, created_at, owner_id')

  if (q) {
    query = query.or(
      `company_name.ilike.%${q}%,contact_name.ilike.%${q}%,email.ilike.%${q}%`
    )
  }

  switch (sort) {
    case 'name':
      query = query.order('company_name', { ascending: true })
      break
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data: clients, error } = await query

  if (error) {
    console.error('clients fetch error:', error)
  }

  const clientList = clients ?? []

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 mt-0.5 text-sm">
            {clientList.length} {clientList.length === 1 ? 'client' : 'clients'}
            {q ? ` matching "${q}"` : ''}
          </p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Client
          </Button>
        </Link>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3 mb-6">
        <form className="flex-1 relative" method="GET">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search clients..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {sort && sort !== 'newest' && (
            <input type="hidden" name="sort" value={sort} />
          )}
        </form>
        <ClientSortSelect currentSort={sort} />
      </div>

      {/* List */}
      {clientList.length === 0 ? (
        <Card className="py-16 text-center">
          <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          {q ? (
            <>
              <p className="text-slate-600 font-medium">No clients match &ldquo;{q}&rdquo;</p>
              <p className="text-sm text-slate-400 mt-1">
                Try a different search or{' '}
                <Link href="/clients" className="text-blue-600 hover:underline">
                  clear the filter
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="text-slate-600 font-medium">No clients yet</p>
              <p className="text-sm text-slate-400 mt-1">
                <Link href="/clients/new" className="text-blue-600 hover:underline">
                  Create your first client
                </Link>{' '}
                to get started
              </p>
            </>
          )}
        </Card>
      ) : (
        <div className="grid gap-3">
          {clientList.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="px-6 py-4 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {client.company_name}
                      </p>
                      <p className="text-sm text-slate-500 truncate">{client.contact_name}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-6 text-sm text-slate-500 shrink-0">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {client.email}
                    </span>
                    {client.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {client.phone}
                      </span>
                    )}
                    <span className="text-slate-400 text-xs">
                      Added {formatDate(client.created_at)}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
