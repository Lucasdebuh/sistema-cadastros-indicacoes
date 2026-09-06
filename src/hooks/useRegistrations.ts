import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Registration } from '../types'

/**
 * Carrega todos os cadastros visíveis para o administrador.
 * A visão registrations_view já traz quem indicou e o total de indicações.
 */
export function useRegistrations() {
  const [data, setData] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const all: Registration[] = []
    const pageSize = 1000
    let from = 0

    // Busca paginada para não esbarrar no limite padrão da API
    for (;;) {
      const { data: page, error: err } = await supabase
        .from('registrations_view')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1)

      if (err) {
        setError('Não foi possível carregar os cadastros.')
        setLoading(false)
        return
      }

      const rows = (page ?? []) as Registration[]
      all.push(...rows)
      if (rows.length < pageSize) break
      from += pageSize
    }

    setData(all)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, reload: load, setData }
}
