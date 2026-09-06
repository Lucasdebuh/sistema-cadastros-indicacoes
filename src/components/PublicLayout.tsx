import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { site } from '../config/site'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex size-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-[var(--shadow-soft)] ${className}`}
    >
      {site.logoInitials ? (
        <span className="text-sm font-bold tracking-tight">{site.logoInitials}</span>
      ) : (
        <UserPlus className="size-5.5" aria-hidden />
      )}
    </div>
  )
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Fundo decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-brand-600 to-brand-700 dark:from-brand-900 dark:to-ink-950"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 -z-10 size-96 rounded-full bg-brand-400/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -left-32 -z-10 size-80 rounded-full bg-brand-300/20 blur-3xl"
      />

      <header className="px-5 pt-7 pb-4 sm:pt-10">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Logo />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-white">{site.name}</p>
            <p className="line-clamp-2 text-sm text-brand-100">{site.tagline}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pb-10">
        <div className="mx-auto w-full max-w-lg">{children}</div>
      </main>

      <footer className="px-5 pb-8">
        <div className="mx-auto max-w-lg text-center text-xs text-ink-500 dark:text-ink-400">
          <Link to="/privacidade" className="font-medium underline underline-offset-4 hover:text-brand-600">
            Política de Privacidade
          </Link>
          <span className="mx-2 opacity-40">|</span>
          <span>Seus dados não são exibidos publicamente.</span>
        </div>
      </footer>
    </div>
  )
}
