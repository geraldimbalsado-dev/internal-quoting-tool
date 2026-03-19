'use client'

import { useActionState } from 'react'
import { submitClientReviewAction } from '@/lib/actions/review'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { CheckCircle, MessageSquare, XCircle, CheckCircle2 } from 'lucide-react'

interface ReviewFormProps {
  token: string
  currentStatus: string
}

const initialState = { error: null as string | null, success: false, action: null as string | null }

const STATUS_MESSAGES: Record<string, { icon: React.ReactNode; title: string; description: string; color: string }> = {
  approved: {
    icon: <CheckCircle2 className="h-12 w-12 text-green-500" />,
    title: 'Quote Approved',
    description: 'Thank you! The team has been notified of your approval.',
    color: 'text-green-700',
  },
  rejected: {
    icon: <XCircle className="h-12 w-12 text-red-400" />,
    title: 'Quote Declined',
    description: 'Your response has been recorded. The team will be in touch.',
    color: 'text-red-700',
  },
  changes_requested: {
    icon: <MessageSquare className="h-12 w-12 text-yellow-500" />,
    title: 'Changes Requested',
    description: 'Your feedback has been sent. The team will prepare a revised quote.',
    color: 'text-yellow-700',
  },
}

export function ReviewForm({ token, currentStatus }: ReviewFormProps) {
  const [state, action, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await submitClientReviewAction(token, formData)
      if (result.error) return { error: result.error, success: false, action: null }
      return { error: null, success: true, action: result.action ?? null }
    },
    initialState
  )

  // Already finalized
  const finalStatuses = ['approved', 'rejected']
  if (finalStatuses.includes(currentStatus) && !state.success) {
    const msg = STATUS_MESSAGES[currentStatus]
    return (
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">{msg.icon}</div>
        <h3 className={`text-lg font-semibold mb-2 ${msg.color}`}>{msg.title}</h3>
        <p className="text-slate-500 text-sm">{msg.description}</p>
      </div>
    )
  }

  // Show success state after submission
  if (state.success && state.action) {
    const msg = STATUS_MESSAGES[state.action]
    return (
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">{msg.icon}</div>
        <h3 className={`text-lg font-semibold mb-2 ${msg.color}`}>{msg.title}</h3>
        <p className="text-slate-500 text-sm">{msg.description}</p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Comments <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <Textarea
          name="comment"
          placeholder="Leave a note for the team…"
          rows={3}
        />
      </div>

      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          name="action"
          value="approved"
          type="submit"
          disabled={pending}
          className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-semibold text-sm bg-green-600 text-white hover:bg-green-700 active:bg-green-800 disabled:opacity-50 transition-colors"
        >
          <CheckCircle className="h-4 w-4" />
          Approve Quote
        </button>
        <button
          name="action"
          value="changes_requested"
          type="submit"
          disabled={pending}
          className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-semibold text-sm bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          Request Changes
        </button>
        <button
          name="action"
          value="rejected"
          type="submit"
          disabled={pending}
          className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-semibold text-sm bg-white text-red-600 border border-red-300 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          <XCircle className="h-4 w-4" />
          Decline
        </button>
      </div>

      {pending && (
        <p className="text-center text-sm text-slate-400">Submitting…</p>
      )}
    </form>
  )
}
