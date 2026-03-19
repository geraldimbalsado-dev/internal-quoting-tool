'use client'

import { useActionState } from 'react'
import { signUp } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState = { error: null as string | null }

export function SignupForm() {
  const [state, action, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await signUp(formData)
      return result ?? initialState
    },
    initialState
  )

  const hasError = !!state.error

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="full_name" required>Full Name</Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          placeholder="Gerald Imbalsado"
          required
          autoComplete="name"
        />
      </div>

      <div>
        <Label htmlFor="email" required>Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          required
          autoComplete="email"
          error={hasError ? ' ' : undefined}
        />
      </div>

      <div>
        <Label htmlFor="password" required>Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          error={hasError ? ' ' : undefined}
        />
      </div>

      {state.error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" loading={pending}>
        Create account
      </Button>
    </form>
  )
}
