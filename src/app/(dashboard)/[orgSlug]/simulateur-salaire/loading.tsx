export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-ap-cream-200 rounded-lg" />
      <div className="h-10 w-80 bg-ap-cream-200 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        <div className="h-96 bg-ap-cream-200 rounded-xl" />
        <div className="h-96 bg-ap-cream-200 rounded-xl" />
      </div>
    </div>
  )
}
