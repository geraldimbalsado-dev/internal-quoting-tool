export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { type QuoteStatus } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  // Stats queries
  const clientsQuery = supabase.from('clients').select('id', { count: 'exact', head: true })
  const quotesQuery = supabase.from('quotes').select('id', { count: 'exact', head: true })
  const sentQuery = supabase
    .from('quotes')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'sent' as QuoteStatus)
  const approvedQuery = supabase
    .from('quotes')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved' as QuoteStatus)

  const [clients, quotes, sent, approved] = await Promise.all([
    clientsQuery,
    quotesQuery,
    sentQuery,
    approvedQuery,
  ])

  // Recent quotes
  const { data: recentQuotes } = await supabase
    .from('quotes')
    .select('id, quote_number, status, created_at, client:clients(company_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    {
      label: 'Total Clients',
      value: clients.count ?? 0,
      icon: Users,
      href: '/clients',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Total Quotes',
      value: quotes.count ?? 0,
      icon: FileText,
      href: '/quotes',
      color: 'text-slate-600',
      bg: 'bg-slate-50',
    },
    {
      label: 'Sent to Clients',
      value: sent.count ?? 0,
      icon: Clock,
      href: '/quotes?status=sent',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      label: 'Approved',
      value: approved.count ?? 0,
      icon: CheckCircle,
      href: '/quotes?status=approved',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ]

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    sent: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    changes_requested: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
  }

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    sent: 'Sent',
    approved: 'Approved',
    changes_requested: 'Changes',
    rejected: 'Rejected',
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {isAdmin ? "You're viewing all team data." : "Your quotes and clients at a glance."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, href, color, bg }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">{label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Quotes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Quotes</CardTitle>
            <Link href="/quotes" className="text-sm text-blue-600 hover:underline font-medium">
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!recentQuotes || recentQuotes.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400 text-sm">
              No quotes yet.{' '}
              <Link href="/quotes/new" className="text-blue-600 hover:underline">
                Create your first quote
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quote</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3">
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {quote.quote_number}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-700">
                      {(quote.client as unknown as { company_name: string } | null)?.company_name ?? '—'}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[quote.status] ?? ''}`}>
                        {statusLabels[quote.status] ?? quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-500">
                      {new Date(quote.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
