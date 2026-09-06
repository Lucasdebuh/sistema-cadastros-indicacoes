import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, CalendarRange, Share2, TrendingUp, UserPlus, Users } from 'lucide-react'
import { useAdmin } from '../../components/AdminLayout'
import { StatCard } from '../../components/StatCard'
import { DailyChart, MonthlyChart, ReferrerChart } from '../../components/Charts'
import { PageLoader } from '../../components/ui/Spinner'
import { computeByDay, computeByMonth, computeRanking, computeTotals, shortName } from '../../lib/stats'

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-ink-200 text-sm text-ink-400 dark:border-ink-800">
      {message}
    </div>
  )
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function Dashboard() {
  const { data, loading, error } = useAdmin()

  const totals = useMemo(() => computeTotals(data), [data])
  const byDay = useMemo(() => computeByDay(data, 30), [data])
  const byMonth = useMemo(() => computeByMonth(data, 12), [data])
  const topReferrers = useMemo(
    () =>
      computeRanking(data, 8)
        .map((r) => ({ key: r.id, label: shortName(r.name), value: r.referral_count }))
        .reverse(),
    [data]
  )

  if (loading) return <PageLoader label="Carregando dashboard..." />

  if (error) {
    return (
      <div className="card p-6 text-center text-sm text-red-600 dark:text-red-400">{error}</div>
    )
  }

  const hasDaily = byDay.some((d) => d.value > 0)
  const hasMonthly = byMonth.some((d) => d.value > 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Visão geral dos cadastros e das indicações.
        </p>
      </div>

      {/* ---------- Cards ---------- */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label="Total de cadastros" value={totals.total} icon={Users} accent="brand" />
        <StatCard label="Cadastros hoje" value={totals.today} icon={UserPlus} accent="emerald" />
        <StatCard
          label="Últimos 7 dias"
          value={totals.last7}
          icon={CalendarDays}
          accent="brand"
        />
        <StatCard label="No mês atual" value={totals.month} icon={CalendarRange} accent="brand" />
        <StatCard
          label="Total de indicações"
          value={totals.referrals}
          icon={Share2}
          accent="violet"
        />
        <StatCard
          label="Indicadores ativos"
          value={totals.activeReferrers}
          icon={TrendingUp}
          accent="amber"
          hint="Pessoas que já indicaram alguém"
        />
      </div>

      {/* ---------- Gráficos ---------- */}
      <Panel title="Cadastros por dia" subtitle="Últimos 30 dias">
        {hasDaily ? <DailyChart data={byDay} /> : <EmptyChart message="Ainda sem cadastros no período." />}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Cadastros por mês" subtitle="Últimos 12 meses">
          {hasMonthly ? (
            <MonthlyChart data={byMonth} />
          ) : (
            <EmptyChart message="Ainda sem cadastros no período." />
          )}
        </Panel>

        <Panel
          title="Maiores indicadores"
          subtitle="Top 8 por número de indicações"
          action={
            <Link
              to="/admin/ranking"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Ver ranking
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        >
          {topReferrers.length > 0 ? (
            <ReferrerChart data={topReferrers} />
          ) : (
            <EmptyChart message="Nenhuma indicação registrada ainda." />
          )}
        </Panel>
      </div>
    </div>
  )
}
