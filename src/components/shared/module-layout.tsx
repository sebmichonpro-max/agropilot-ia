import { ChevronRight } from 'lucide-react'

interface Breadcrumb {
  label: string
  href?: string
}

interface ModuleLayoutProps {
  title: string
  description?: string
  breadcrumbs?: Breadcrumb[]
  children: React.ReactNode
}

export function ModuleLayout({
  title,
  description,
  breadcrumbs,
  children,
}: ModuleLayoutProps) {
  return (
    <div className="space-y-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-ap-cream-700">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-ap-green-900 transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-ap-green-900 font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div>
        <h1 className="text-2xl font-semibold text-ap-green-900">{title}</h1>
        {description && (
          <p className="mt-1 text-ap-cream-800">{description}</p>
        )}
      </div>

      {children}
    </div>
  )
}
