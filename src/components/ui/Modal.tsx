import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } as const

export function Modal({ open, title, description, onClose, children, footer, size = 'md' }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="animate-[var(--animate-fade-in)] absolute inset-0 bg-ink-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-[var(--animate-fade-up)] card relative w-full ${SIZES[size]} max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-2xl`}
      >
        <div className="flex items-start gap-3 border-b border-ink-200 p-5 dark:border-ink-800">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost btn-sm -mt-1 -mr-1 !px-2"
            aria-label="Fechar"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children && <div className="p-5">{children}</div>}
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-ink-200 p-5 sm:flex-row sm:justify-end dark:border-ink-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
