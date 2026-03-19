'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AppError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-2xl mb-4">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
        <p className="text-slate-500 text-sm mb-6">
          An unexpected error occurred. Try refreshing the page.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Dashboard
          </a>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-slate-400 font-mono">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
