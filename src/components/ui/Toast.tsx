import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'
type Toast = { id: number; kind: ToastKind; message: string }

type ToastApi = {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return ctx
}

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
} as const

const STYLES: Record<ToastKind, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
  error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100',
  info: 'border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-100',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, kind, message }])
      window.setTimeout(() => dismiss(id), 4500)
    },
    [dismiss]
  )

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fixed inset-x-3 bottom-3 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.kind]
          return (
            <div
              key={t.id}
              className={`animate-[var(--animate-fade-up)] flex items-start gap-3 rounded-xl border px-4 py-3 shadow-[var(--shadow-card)] ${STYLES[t.kind]}`}
            >
              <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
              <p className="flex-1 text-sm font-medium">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-lg p-1 opacity-60 transition hover:opacity-100"
                aria-label="Fechar aviso"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
