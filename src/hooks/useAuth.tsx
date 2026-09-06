import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isConfigured } from '../lib/supabase'

type AuthState = {
  session: Session | null
  isAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }

    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      if (!data.session) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return
      setSession(next)
      if (!next) {
        setIsAdmin(false)
        setLoading(false)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Confirma se o usuário logado está na tabela de administradores.
  useEffect(() => {
    let active = true

    if (!session) {
      setIsAdmin(false)
      return
    }

    setLoading(true)
    supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        setIsAdmin(Boolean(data))
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [session])

  const value = useMemo<AuthState>(
    () => ({
      session,
      isAdmin,
      loading,
      signIn: async (email, password) => {
        if (!isConfigured) return { error: 'Sistema ainda não configurado.' }
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (!error) return { error: null }
        if (error.message.toLowerCase().includes('invalid')) {
          return { error: 'E-mail ou senha incorretos.' }
        }
        if (error.message.toLowerCase().includes('email not confirmed')) {
          return { error: 'E-mail ainda não confirmado.' }
        }
        return { error: 'Não foi possível entrar. Tente novamente.' }
      },
      signOut: async () => {
        await supabase.auth.signOut()
        setIsAdmin(false)
      },
    }),
    [session, isAdmin, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
