export function SkeletonMessage() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-elevated rounded animate-shimmer w-3/4" />
        <div className="h-4 bg-elevated rounded animate-shimmer w-full" />
        <div className="h-4 bg-elevated rounded animate-shimmer w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonSession() {
  return (
    <div className="flex items-center gap-3 px-3 py-2 animate-fade-in">
      <div className="h-3 bg-elevated rounded animate-shimmer flex-1" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-5 h-5 rounded bg-elevated animate-pulse" />
        <div className="h-5 bg-elevated rounded animate-shimmer w-32" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-elevated rounded animate-shimmer w-full" />
        <div className="h-4 bg-elevated rounded animate-shimmer w-2/3" />
      </div>
    </div>
  );
}
