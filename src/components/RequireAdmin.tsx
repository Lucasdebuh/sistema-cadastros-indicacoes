import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { PageLoader } from './ui/Spinner'

/** Protege as rotas de /admin */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, isAdmin, loading, signOut } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader label="Verificando acesso..." />

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  }

  // Autenticado, porém sem permissão de administrador
  if (!isAdmin) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="card w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
            <ShieldAlert className="size-7" aria-hidden />
          </div>
          <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
            Sua conta está autenticada, mas não tem permissão de administrador.
          </p>
          <button type="button" onClick={() => void signOut()} className="btn-secondary btn-md mt-6 w-full">
            Sair
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
