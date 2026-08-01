export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-ap-cream-200 rounded animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-ap-cream-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-ap-cream-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
