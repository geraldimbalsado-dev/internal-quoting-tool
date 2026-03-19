'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { type Client, type Quote } from '@/types'
import Link from 'next/link'

interface QuoteFormProps {
  quote?: Quote
  clients: Client[]
  defaultClientId?: string
  action: (formData: FormData) => Promise<{ error: string } | void>
  submitLabel?: string
}

const initialState = { error: null as string | null }

export function QuoteForm({
  quote,
  clients,
  defaultClientId,
  action,
  submitLabel = 'Save Quote',
}: QuoteFormProps) {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await action(formData)
      return result ? { error: result.error } : initialState
    },
    initialState
  )

  const cancelHref = quote ? `/quotes/${quote.id}` : '/quotes'

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="client_id" required>Client</Label>
        <Select
          id="client_id"
          name="client_id"
          defaultValue={quote?.client_id ?? defaultClientId ?? ''}
          required
        >
          <option value="">Select a client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company_name} — {c.contact_name}
            </option>
          ))}
        </Select>
        {clients.length === 0 && (
          <p className="mt-1 text-xs text-amber-600">
            No clients yet.{' '}
            <Link href="/clients/new" className="underline">
              Create one first.
            </Link>
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="validity_date">Valid Until</Label>
        <Input
          id="validity_date"
          name="validity_date"
          type="date"
          defaultValue={quote?.validity_date ?? ''}
        />
        <p className="mt-1 text-xs text-slate-400">
          Leave blank for no expiry.
        </p>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={quote?.notes ?? ''}
          placeholder="Internal notes or terms visible on the quote…"
          rows={4}
          maxLength={2000}
        />
      </div>

      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={pending} disabled={clients.length === 0}>
          {submitLabel}
        </Button>
        <Link href={cancelHref}>
          <Button type="button" variant="ghost">Cancel</Button>
        </Link>
      </div>
    </form>
  )
}
