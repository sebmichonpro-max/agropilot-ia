export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-ap-cream-200 rounded" />
      <div className="flex gap-2">
        <div className="h-10 w-28 bg-ap-cream-200 rounded-lg" />
        <div className="h-10 w-28 bg-ap-cream-200 rounded-lg" />
        <div className="h-10 w-28 bg-ap-cream-200 rounded-lg" />
      </div>
      <div className="h-64 bg-ap-cream-200 rounded-xl" />
    </div>
  )
}
