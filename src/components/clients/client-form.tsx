'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type Client } from '@/types'
import Link from 'next/link'

interface ClientFormProps {
  client?: Client
  action: (formData: FormData) => Promise<{ error: string } | void>
  submitLabel?: string
}

const initialState = { error: null as string | null }

export function ClientForm({ client, action, submitLabel = 'Save Client' }: ClientFormProps) {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await action(formData)
      return result ? { error: result.error } : initialState
    },
    initialState
  )

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company_name" required>Company Name</Label>
          <Input
            id="company_name"
            name="company_name"
            defaultValue={client?.company_name}
            placeholder="Acme Corporation"
            required
            maxLength={200}
          />
        </div>
        <div>
          <Label htmlFor="contact_name" required>Contact Name</Label>
          <Input
            id="contact_name"
            name="contact_name"
            defaultValue={client?.contact_name}
            placeholder="Jane Smith"
            required
            maxLength={200}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email" required>Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={client?.email}
            placeholder="jane@acme.com"
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={client?.phone ?? ''}
            placeholder="+1 (555) 000-0000"
            maxLength={50}
          />
        </div>
      </div>

      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
        <Link href={client ? `/clients/${client.id}` : '/clients'}>
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  )
}
