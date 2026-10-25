import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Skeleton } from '@/components/ui/skeleton'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white text-black flex items-center justify-center font-black text-sm">
            7d
          </div>
          <span className="text-xl font-bold tracking-tight text-white">7dc</span>
        </div>
        <div className="w-64 space-y-2">
          <Skeleton className="h-4 w-full bg-neutral-800" />
          <Skeleton className="h-4 w-4/5 mx-auto bg-neutral-800" />
        </div>
        <p className="text-xs text-neutral-500 animate-pulse">
          Validando credenciais administrativas...
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
