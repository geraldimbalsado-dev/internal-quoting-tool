export default function AppLoading() {
  return (
    <div className="p-8 max-w-5xl animate-pulse">
      {/* Page title skeleton */}
      <div className="h-8 w-48 bg-slate-200 rounded-lg mb-2" />
      <div className="h-4 w-72 bg-slate-100 rounded mb-8" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="h-3 w-20 bg-slate-200 rounded mb-3" />
            <div className="h-7 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="h-5 w-32 bg-slate-200 rounded" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 last:border-0">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-4 w-36 bg-slate-100 rounded" />
            <div className="h-5 w-16 bg-slate-100 rounded-full ml-auto" />
            <div className="h-4 w-20 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
