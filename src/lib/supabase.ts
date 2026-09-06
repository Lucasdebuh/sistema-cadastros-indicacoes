import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** true quando as variáveis de ambiente foram preenchidas */
export const isConfigured = Boolean(
  url && anonKey && url.startsWith('http') && anonKey.length > 20
)

/**
 * Cliente do Supabase.
 * Usa apenas a chave "anon public" - segura para ficar no frontend,
 * porque toda a proteção real está nas políticas de RLS do banco.
 */
export const supabase: SupabaseClient = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'cadastro-admin-auth',
    },
  }
)
