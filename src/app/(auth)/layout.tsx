export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-emerald-900">
            SMAPIA
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestion intelligente pour l&apos;agroalimentaire
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
