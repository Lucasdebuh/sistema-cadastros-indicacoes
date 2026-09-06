import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useChartTheme } from '../hooks/useIsDark'
import type { DayPoint } from '../lib/stats'

const nf = new Intl.NumberFormat('pt-BR')

type TooltipPayload = { payload?: DayPoint; value?: number }

function ChartTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  unit: string
}) {
  const theme = useChartTheme()
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  const value = Number(payload[0]?.value ?? 0)

  return (
    <div
      className="rounded-xl border px-3 py-2 text-sm shadow-[var(--shadow-card)]"
      style={{
        background: theme.tooltipBg,
        borderColor: theme.tooltipBorder,
        color: theme.tooltipText,
      }}
    >
      <p className="font-medium opacity-70">{point?.label}</p>
      <p className="mt-0.5 font-semibold tabular-nums">
        {nf.format(value)} {value === 1 ? unit : `${unit}s`}
      </p>
    </div>
  )
}

/** Cadastros por dia - série única, área suave */
export function DailyChart({ data }: { data: DayPoint[] }) {
  const t = useChartTheme()
  const tickStep = Math.max(1, Math.ceil(data.length / 8))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="dailyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t.series} stopOpacity={0.18} />
            <stop offset="100%" stopColor={t.series} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={t.grid} strokeWidth={1} />
        <XAxis
          dataKey="label"
          tick={{ fill: t.axis, fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: t.grid }}
          interval={tickStep - 1}
          minTickGap={8}
        />
        <YAxis
          tick={{ fill: t.axis, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={44}
        />
        <Tooltip
          content={<ChartTooltip unit="cadastro" />}
          cursor={{ stroke: t.axis, strokeWidth: 1, strokeOpacity: 0.4 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={t.series}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="url(#dailyFill)"
          activeDot={{ r: 4.5, fill: t.series, stroke: t.surface, strokeWidth: 2 }}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Cadastros por mês - colunas */
export function MonthlyChart({ data }: { data: DayPoint[] }) {
  const t = useChartTheme()

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid vertical={false} stroke={t.grid} strokeWidth={1} />
        <XAxis
          dataKey="label"
          tick={{ fill: t.axis, fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: t.grid }}
          minTickGap={4}
        />
        <YAxis
          tick={{ fill: t.axis, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={44}
        />
        <Tooltip
          content={<ChartTooltip unit="cadastro" />}
          cursor={{ fill: t.axis, fillOpacity: 0.07 }}
        />
        <Bar dataKey="value" fill={t.series} maxBarSize={24} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Ranking de indicadores - barras horizontais */
export function ReferrerChart({ data }: { data: DayPoint[] }) {
  const t = useChartTheme()
  const height = Math.max(180, data.length * 42 + 24)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 4 }}>
        <CartesianGrid horizontal={false} stroke={t.grid} strokeWidth={1} />
        <XAxis
          type="number"
          tick={{ fill: t.axis, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: t.axis, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={110}
        />
        <Tooltip
          content={<ChartTooltip unit="indicação" />}
          cursor={{ fill: t.axis, fillOpacity: 0.07 }}
        />
        <Bar dataKey="value" maxBarSize={22} radius={[0, 4, 4, 0]}>
          {data.map((d) => (
            <Cell key={d.key} fill={t.series} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
