'use client'

import { useActionState } from 'react'
import { signIn } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState = { error: null as string | null }

export function LoginForm() {
  const [state, action, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await signIn(formData)
      return result ?? initialState
    },
    initialState
  )

  const hasError = !!state.error

  return (
    <form action={action} className="space-y-4" aria-describedby={hasError ? 'login-error' : undefined}>
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
          autoComplete="current-password"
          error={hasError ? ' ' : undefined}
        />
      </div>

      {state.error && (
        <div id="login-error" role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" loading={pending}>
        Sign in
      </Button>
    </form>
  )
}
