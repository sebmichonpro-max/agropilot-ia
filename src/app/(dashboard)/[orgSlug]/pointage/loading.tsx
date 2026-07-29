export default function PointageLoading() {
  return (
    <div>
      <div className="h-8 w-48 bg-ap-cream-200 rounded animate-pulse mb-4" />
      <div className="flex gap-1 border-b border-ap-cream-200 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-28 bg-ap-cream-100 rounded-t animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-ap-cream-100 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 bg-ap-cream-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
