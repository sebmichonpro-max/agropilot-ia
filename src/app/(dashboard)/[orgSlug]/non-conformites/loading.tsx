import { Card, CardContent } from '@/components/ui/card'

export default function NcLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 rounded bg-ap-cream-200 animate-pulse" />
        <div className="mt-2 h-5 w-72 rounded bg-ap-cream-200 animate-pulse" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-ap-cream-200 rounded-xl">
            <CardContent className="p-4 space-y-2">
              <div className="h-4 w-24 rounded bg-ap-cream-200 animate-pulse" />
              <div className="h-5 w-3/4 rounded bg-ap-cream-200 animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-ap-cream-200 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
