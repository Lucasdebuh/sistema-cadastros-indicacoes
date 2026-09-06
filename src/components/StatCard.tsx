import type { LucideIcon } from 'lucide-react'

type Props = {
  label: string
  value: number
  icon: LucideIcon
  hint?: string
  accent?: 'brand' | 'emerald' | 'amber' | 'violet'
}

const ACCENTS = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300',
} as const

const nf = new Intl.NumberFormat('pt-BR')

export function StatCard({ label, value, icon: Icon, hint, accent = 'brand' }: Props) {
  return (
    <div className="card animate-[var(--animate-fade-up)] p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-500 dark:text-ink-400">{label}</p>
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${ACCENTS[accent]}`}>
          <Icon className="size-4.5" aria-hidden />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{nf.format(value)}</p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  )
}
