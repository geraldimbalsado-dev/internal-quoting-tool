'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createQuoteVersionAction } from '@/lib/actions/quotes'
import { QuoteStatusBadge } from './quote-status-badge'
import { Button } from '@/components/ui/button'
import { type QuoteStatus } from '@/types'
import { formatDate } from '@/lib/utils'
import { GitBranch, CheckCircle2 } from 'lucide-react'

interface QuoteVersion {
  id: string
  quote_number: string
  version: number
  status: string
  created_at: string
  validity_date: string | null
}

interface VersionHistoryProps {
  currentQuoteId: string
  versions: QuoteVersion[]
  canCreateVersion: boolean
}

export function VersionHistory({ currentQuoteId, versions, canCreateVersion }: VersionHistoryProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const sorted = [...versions].sort((a, b) => a.version - b.version)

  function handleCreateVersion() {
    setError(null)
    startTransition(async () => {
      const result = await createQuoteVersionAction(currentQuoteId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div>
      {/* Version list */}
      <div className="divide-y divide-slate-50">
        {sorted.map((v) => {
          const isCurrent = v.id === currentQuoteId
          return (
            <div
              key={v.id}
              className={`flex items-center justify-between px-6 py-3 ${isCurrent ? 'bg-blue-50/50' : 'hover:bg-slate-50'} transition-colors`}
            >
              <div className="flex items-center gap-3">
                {isCurrent ? (
                  <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-slate-300 shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isCurrent ? 'text-blue-700' : 'text-slate-700'}`}>
                      v{v.version}
                    </span>
                    <QuoteStatusBadge status={v.status as QuoteStatus} />
                    {isCurrent && (
                      <span className="text-xs text-blue-500 font-medium">current</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {v.quote_number} · Created {formatDate(v.created_at)}
                    {v.validity_date && ` · Valid until ${formatDate(v.validity_date)}`}
                  </p>
                </div>
              </div>

              {!isCurrent && (
                <Link
                  href={`/quotes/${v.id}`}
                  className="text-sm text-blue-600 hover:underline font-medium shrink-0"
                >
                  View
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Create new version button */}
      {canCreateVersion && (
        <div className="px-6 py-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Creates a copy of this quote as a new draft version.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateVersion}
              loading={isPending}
            >
              <GitBranch className="h-3.5 w-3.5" />
              New Version
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  )
}
