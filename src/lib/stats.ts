import type { Registration } from '../types'

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export type Totals = {
  total: number
  today: number
  last7: number
  month: number
  referrals: number
  activeReferrers: number
}

export function computeTotals(items: Registration[]): Totals {
  const now = new Date()
  const todayStart = startOfDay(now)
  const sevenAgo = new Date(todayStart)
  sevenAgo.setDate(sevenAgo.getDate() - 6)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  let today = 0
  let last7 = 0
  let month = 0
  let referrals = 0
  const referrers = new Set<string>()

  for (const r of items) {
    const created = new Date(r.created_at)
    if (created >= todayStart) today++
    if (created >= sevenAgo) last7++
    if (created >= monthStart) month++
    if (r.referred_by) {
      referrals++
      referrers.add(r.referred_by)
    }
  }

  return {
    total: items.length,
    today,
    last7,
    month,
    referrals,
    activeReferrers: referrers.size,
  }
}

export type DayPoint = { key: string; label: string; value: number }

/** Série diária dos últimos N dias, incluindo dias sem cadastro */
export function computeByDay(items: Registration[], days = 30): DayPoint[] {
  const counts = new Map<string, number>()
  for (const r of items) {
    const key = dayKey(new Date(r.created_at))
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const out: DayPoint[] = []
  const cursor = startOfDay(new Date())
  cursor.setDate(cursor.getDate() - (days - 1))

  for (let i = 0; i < days; i++) {
    const key = dayKey(cursor)
    out.push({
      key,
      label: `${String(cursor.getDate()).padStart(2, '0')}/${String(cursor.getMonth() + 1).padStart(2, '0')}`,
      value: counts.get(key) ?? 0,
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

/** Série mensal dos últimos N meses */
export function computeByMonth(items: Registration[], months = 12): DayPoint[] {
  const counts = new Map<string, number>()
  for (const r of items) {
    const d = new Date(r.created_at)
    counts.set(`${d.getFullYear()}-${d.getMonth()}`, (counts.get(`${d.getFullYear()}-${d.getMonth()}`) ?? 0) + 1)
  }

  const out: DayPoint[] = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    out.push({
      key,
      label: `${MONTHS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
      value: counts.get(key) ?? 0,
    })
  }
  return out
}

export type RankedReferrer = Registration & { position: number }

/** Ranking de quem mais indicou */
export function computeRanking(items: Registration[], limit?: number): RankedReferrer[] {
  const ranked = items
    .filter((r) => r.referral_count > 0)
    .sort((a, b) => {
      if (b.referral_count !== a.referral_count) return b.referral_count - a.referral_count
      return a.created_at.localeCompare(b.created_at)
    })
    .map((r, i) => ({ ...r, position: i + 1 }))

  return typeof limit === 'number' ? ranked.slice(0, limit) : ranked
}

/** Primeiro nome + inicial do sobrenome, para caber nos eixos */
export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0] ?? ''
  return `${parts[0]} ${(parts[parts.length - 1] ?? '').charAt(0)}.`
}
