'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deleteQuoteAction } from '@/lib/actions/quotes'
import { Trash2 } from 'lucide-react'

interface DeleteQuoteButtonProps {
  quoteId: string
  quoteNumber: string
  canDelete: boolean
}

export function DeleteQuoteButton({ quoteId, quoteNumber, canDelete }: DeleteQuoteButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canDelete) return null

  async function handleDelete() {
    setLoading(true)
    const result = await deleteQuoteAction(quoteId)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Delete {quoteNumber}?</span>
          <Button variant="danger" size="sm" loading={loading} onClick={handleDelete}>
            Yes, delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>Cancel</Button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setConfirming(true)}
      className="text-slate-400 hover:text-red-600"
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </Button>
  )
}
