import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Medal, Trophy } from 'lucide-react'
import { useAdmin } from '../../components/AdminLayout'
import { ReferrerChart } from '../../components/Charts'
import { PageLoader } from '../../components/ui/Spinner'
import { computeRanking, shortName } from '../../lib/stats'
import { displayPhone, initialsOf } from '../../lib/format'

const MEDALS: Record<number, string> = {
  1: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  2: 'bg-ink-200 text-ink-700 dark:bg-ink-700 dark:text-ink-200',
  3: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
}

export default function Ranking() {
  const { data, loading } = useAdmin()

  const ranked = useMemo(() => computeRanking(data), [data])
  const chartData = useMemo(
    () =>
      ranked
        .slice(0, 10)
        .map((r) => ({ key: r.id, label: shortName(r.name), value: r.referral_count }))
        .reverse(),
    [ranked]
  )

  if (loading) return <PageLoader label="Calculando ranking..." />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ranking de indicações</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          {ranked.length === 0
            ? 'Nenhuma indicação registrada até agora.'
            : `${ranked.length} pessoa(s) já indicaram alguém.`}
        </p>
      </div>

      {ranked.length === 0 ? (
        <div className="card p-12 text-center">
          <Trophy className="mx-auto size-10 text-ink-300" aria-hidden />
          <p className="mt-3 font-medium">Ainda sem indicações</p>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            O ranking aparece assim que alguém se cadastrar por um link de indicação.
          </p>
        </div>
      ) : (
        <>
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Top 10 indicadores</h2>
            <ReferrerChart data={chartData} />
          </section>

          <section className="card overflow-hidden">
            <h2 className="border-b border-ink-200 p-5 font-semibold dark:border-ink-800">
              Classificação completa
            </h2>
            <ol>
              {ranked.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-3 border-b border-ink-100 p-4 last:border-0 hover:bg-ink-50 sm:gap-4 dark:border-ink-800/70 dark:hover:bg-ink-800/40"
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold tabular-nums ${
                      MEDALS[r.position] ?? 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'
                    }`}
                  >
                    {r.position <= 3 ? <Medal className="size-4.5" aria-hidden /> : r.position}
                  </span>

                  <span className="hidden size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 sm:flex dark:bg-brand-950 dark:text-brand-300">
                    {initialsOf(r.name)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/admin/pessoa/${r.id}`}
                      className="line-clamp-1 font-semibold hover:text-brand-600"
                    >
                      {r.position}. {r.name}
                    </Link>
                    <p className="text-sm tabular-nums text-ink-500 dark:text-ink-400">
                      {displayPhone(r.phone)}
                      <span className="mx-1.5 opacity-40">|</span>
                      <span className="font-mono">{r.referral_code}</span>
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xl font-bold tabular-nums text-brand-600 dark:text-brand-400">
                      {r.referral_count}
                    </p>
                    <p className="text-xs text-ink-400">
                      {r.referral_count === 1 ? 'indicação' : 'indicações'}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  )
}
