import Link from 'next/link'
import { ShieldX } from 'lucide-react'

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-2xl mb-4">
          <ShieldX className="h-7 w-7 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500 text-sm mb-6">
          You don&apos;t have permission to view this page.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
