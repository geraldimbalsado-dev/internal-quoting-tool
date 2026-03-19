export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth'
import { createClientAction } from '@/lib/actions/clients'
import { ClientForm } from '@/components/clients/client-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function NewClientPage() {
  await requireAuth()

  return (
    <div className="p-8 max-w-2xl">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Clients
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>New Client</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm action={createClientAction} submitLabel="Create Client" />
        </CardContent>
      </Card>
    </div>
  )
}
