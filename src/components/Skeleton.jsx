export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg skeleton shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 skeleton w-3/4" />
          <div className="h-3 skeleton w-1/2" />
          <div className="h-3 skeleton w-1/3" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3">
      <div className="w-9 h-9 rounded-lg skeleton shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 skeleton w-2/3" />
        <div className="h-2.5 skeleton w-1/3" />
      </div>
    </div>
  )
}

export function SkeletonFolder() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-lg skeleton" />
        <div className="w-8 h-5 rounded-full skeleton" />
      </div>
      <div className="h-4 skeleton w-3/4 mt-3" />
      <div className="h-3 skeleton w-1/2 mt-2" />
    </div>
  )
}

export function SkeletonHomePage() {
  return (
    <div className="space-y-6 pb-8">
      <div className="bg-slate-200 rounded-2xl h-48 skeleton" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 rounded-xl skeleton" />
        <div className="h-16 rounded-xl skeleton" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  )
}
