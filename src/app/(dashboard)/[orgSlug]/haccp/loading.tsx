import { Card, CardContent } from '@/components/ui/card'

export default function HaccpLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-32 rounded bg-ap-cream-200 animate-pulse" />
        <div className="mt-2 h-5 w-80 rounded bg-ap-cream-200 animate-pulse" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-ap-cream-200 rounded-xl">
            <CardContent className="p-4 space-y-3">
              <div className="h-5 w-3/4 rounded bg-ap-cream-200 animate-pulse" />
              <div className="h-4 w-full rounded bg-ap-cream-200 animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-ap-cream-200 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
