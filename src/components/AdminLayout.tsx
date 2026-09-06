import { useState } from 'react'
import { NavLink, Outlet, useOutletContext } from 'react-router-dom'
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Network as NetworkIcon,
  RefreshCw,
  Sun,
  Trophy,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { useRegistrations } from '../hooks/useRegistrations'
import { Logo } from './PublicLayout'
import { site } from '../config/site'
import type { Registration } from '../types'

export type AdminContext = {
  data: Registration[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

export function useAdmin(): AdminContext {
  return useOutletContext<AdminContext>()
}

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/cadastros', label: 'Cadastros', icon: Users, end: false },
  { to: '/admin/ranking', label: 'Ranking', icon: Trophy, end: false },
  { to: '/admin/rede', label: 'Rede', icon: NetworkIcon, end: false },
] as const

export function AdminLayout() {
  const { signOut, session } = useAuth()
  const { theme, toggle } = useTheme()
  const { data, loading, error, reload } = useRegistrations()
  const [menuOpen, setMenuOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function handleReload() {
    setRefreshing(true)
    await reload()
    setRefreshing(false)
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-brand-600 text-white shadow-[var(--shadow-soft)]'
        : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'
    }`

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-950">
      {/* ---------- Barra superior ---------- */}
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/85 backdrop-blur-md dark:border-ink-800 dark:bg-ink-900/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            className="btn-ghost btn-sm !px-2 lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="size-5" aria-hidden />
          </button>

          <div className="flex items-center gap-2.5">
            <Logo className="!size-9 !rounded-xl" />
            <div className="hidden sm:block">
              <p className="text-sm leading-tight font-semibold">{site.name}</p>
              <p className="text-xs leading-tight text-ink-500">Painel administrativo</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleReload}
              className="btn-ghost btn-sm !px-2"
              aria-label="Atualizar dados"
              title="Atualizar dados"
            >
              <RefreshCw className={`size-5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden />
            </button>
            <button
              type="button"
              onClick={toggle}
              className="btn-ghost btn-sm !px-2"
              aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
              title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            >
              {theme === 'dark' ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="btn-ghost btn-sm gap-2"
              aria-label="Sair do painel"
            >
              <LogOut className="size-5" aria-hidden />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* ---------- Menu lateral (desktop) ---------- */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-22 space-y-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={navLinkClass}>
                <Icon className="size-4.5 shrink-0" aria-hidden />
                {label}
              </NavLink>
            ))}
            <p className="truncate px-3.5 pt-6 text-xs text-ink-400" title={session?.user.email ?? ''}>
              {session?.user.email}
            </p>
          </nav>
        </aside>

        {/* ---------- Menu lateral (mobile) ---------- */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="animate-[var(--animate-fade-in)] absolute inset-0 bg-ink-950/50"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <nav className="animate-[var(--animate-fade-in)] absolute inset-y-0 left-0 w-72 space-y-1 bg-white p-4 shadow-2xl dark:bg-ink-900">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold">Menu</p>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="btn-ghost btn-sm !px-2"
                  aria-label="Fechar menu"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              {NAV.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={navLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon className="size-4.5 shrink-0" aria-hidden />
                  {label}
                </NavLink>
              ))}
              <p className="truncate px-3.5 pt-6 text-xs text-ink-400">{session?.user.email}</p>
            </nav>
          </div>
        )}

        {/* ---------- Conteúdo ---------- */}
        <main className="min-w-0 flex-1 pb-20 lg:pb-0">
          <Outlet context={{ data, loading, error, reload } satisfies AdminContext} />
        </main>
      </div>

      {/* ---------- Navegação inferior (mobile) ---------- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 backdrop-blur-md lg:hidden dark:border-ink-800 dark:bg-ink-900/95">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-brand-600' : 'text-ink-500 dark:text-ink-400'
                }`
              }
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
