export default function MargeFlashLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-ap-cream-200 rounded" />
      <div className="h-10 w-full bg-ap-cream-200 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-ap-cream-200 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-ap-cream-200 rounded-xl" />
    </div>
  )
}
