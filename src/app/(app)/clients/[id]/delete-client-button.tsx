'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deleteClientAction } from '@/lib/actions/clients'
import { Trash2 } from 'lucide-react'

interface DeleteClientButtonProps {
  clientId: string
  companyName: string
}

export function DeleteClientButton({ clientId, companyName }: DeleteClientButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    const result = await deleteClientAction(clientId)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Delete &ldquo;{companyName}&rdquo;?</span>
          <Button variant="danger" size="sm" loading={loading} onClick={handleDelete}>
            Yes, delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} className="text-slate-400 hover:text-red-600">
      <Trash2 className="h-4 w-4" />
      Delete
    </Button>
  )
}
