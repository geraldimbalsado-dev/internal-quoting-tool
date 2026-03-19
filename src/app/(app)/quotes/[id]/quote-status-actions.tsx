'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { updateQuoteStatusAction } from '@/lib/actions/quotes'
import { sendQuoteToClientAction } from '@/lib/actions/email'
import { type QuoteStatus } from '@/types'
import { Send, CheckCircle, RotateCcw, Copy, Check, RefreshCw } from 'lucide-react'

interface QuoteStatusActionsProps {
  quoteId: string
  currentStatus: QuoteStatus
  publicToken: string
}

export function QuoteStatusActions({ quoteId, currentStatus, publicToken }: QuoteStatusActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const reviewUrl = `${appUrl}/review/${publicToken}`

  function run(fn: () => Promise<{ error?: string; success?: boolean } | void>) {
    setError(null)
    setSuccessMsg(null)
    startTransition(async () => {
      const result = await fn()
      if (result && 'error' in result && result.error) setError(result.error)
    })
  }

  async function copyLink() {
    await navigator.clipboard.writeText(reviewUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Copy review link — always visible */}
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Copy Review Link'}
        </button>

        <div className="flex-1" />

        {/* Draft: send to client */}
        {currentStatus === 'draft' && (
          <Button
            size="sm"
            onClick={() => run(() => sendQuoteToClientAction(quoteId))}
            loading={isPending}
          >
            <Send className="h-3.5 w-3.5" />
            Send to Client
          </Button>
        )}

        {/* Sent: back to draft or resend */}
        {currentStatus === 'sent' && (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => run(() => updateQuoteStatusAction(quoteId, 'draft'))}
              loading={isPending}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Back to Draft
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => run(() => sendQuoteToClientAction(quoteId))}
              loading={isPending}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Resend Email
            </Button>
            <Button
              size="sm"
              onClick={() => run(() => updateQuoteStatusAction(quoteId, 'approved'))}
              loading={isPending}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Mark Approved
            </Button>
          </>
        )}

        {/* Changes requested: back to draft or resend updated version */}
        {currentStatus === 'changes_requested' && (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => run(() => updateQuoteStatusAction(quoteId, 'draft'))}
              loading={isPending}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Back to Draft
            </Button>
            <Button
              size="sm"
              onClick={() => run(() => sendQuoteToClientAction(quoteId))}
              loading={isPending}
            >
              <Send className="h-3.5 w-3.5" />
              Send Updated Version
            </Button>
          </>
        )}

        {(currentStatus === 'approved' || currentStatus === 'rejected') && (
          <span className="text-sm text-slate-400 italic">
            Create a new version to make changes.
          </span>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {successMsg && <p className="mt-2 text-sm text-green-600">{successMsg}</p>}
    </div>
  )
}
