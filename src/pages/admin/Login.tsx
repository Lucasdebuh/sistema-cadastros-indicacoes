import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { isConfigured } from '../../lib/supabase'
import { Logo } from '../../components/PublicLayout'
import { site } from '../../config/site'

export default function Login() {
  const { session, isAdmin, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (session && isAdmin) navigate('/admin', { replace: true })
  }, [session, isAdmin, navigate])

  if (!loading && session && isAdmin) return <Navigate to="/admin" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError(null)

    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.')
      return
    }

    setSubmitting(true)
    const { error: err } = await signIn(email, password)
    setSubmitting(false)

    if (err) setError(err)
    else navigate('/admin', { replace: true })
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink-100 p-5 dark:bg-ink-950">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[560px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl"
      />

      <div className="animate-[var(--animate-fade-up)] card w-full max-w-md p-7 sm:p-9">
        <div className="flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Painel administrativo</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Acesso restrito a administradores de {site.name}.
          </p>
        </div>

        {!isConfigured && (
          <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            O banco de dados ainda não foi conectado. Configure as variáveis{' '}
            <code className="font-mono text-xs">VITE_SUPABASE_URL</code> e{' '}
            <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code>.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
          <div>
            <label htmlFor="email" className="label">
              E-mail
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-400"
                aria-hidden
              />
              <input
                id="email"
                type="email"
                autoComplete="username"
                className="input pl-12"
                placeholder="você@exemplo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="label">
              Senha
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-400"
                aria-hidden
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="input pr-12 pl-12"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-2 text-ink-400 transition hover:text-ink-600"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="animate-[var(--animate-fade-in)] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
            >
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary btn-lg w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden />
                Entrando...
              </>
            ) : (
              <>
                <LogIn className="size-5" aria-hidden />
                Entrar
              </>
            )}
          </button>
        </form>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-ink-500 dark:text-ink-400">
          <ShieldCheck className="size-4 shrink-0" aria-hidden />
          Área protegida. Tentativas de acesso são registradas.
        </p>
      </div>
    </div>
  )
}
