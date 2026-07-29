export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ap-cream-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-ap-green-900">
            AgroPilot.IA
          </h1>
          <p className="mt-1 text-sm text-ap-cream-700">
            Gestion intelligente pour l&apos;agroalimentaire
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
