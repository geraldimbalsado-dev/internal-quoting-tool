'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function ClientSortSelect({ currentSort }: { currentSort: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', e.target.value)
    router.push(`/clients?${params.toString()}`)
  }

  return (
    <select
      value={currentSort}
      onChange={handleChange}
      className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="newest">Newest first</option>
      <option value="oldest">Oldest first</option>
      <option value="name">Name A–Z</option>
    </select>
  )
}
