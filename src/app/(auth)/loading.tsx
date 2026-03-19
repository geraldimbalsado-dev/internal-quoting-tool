export default function AuthLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-pulse">
        <div className="h-8 w-32 bg-slate-200 rounded mx-auto mb-2" />
        <div className="h-4 w-48 bg-slate-100 rounded mx-auto mb-8" />
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-16 bg-slate-200 rounded" />
            <div className="h-9 w-full bg-slate-100 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 bg-slate-200 rounded" />
            <div className="h-9 w-full bg-slate-100 rounded-lg" />
          </div>
          <div className="h-10 w-full bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
