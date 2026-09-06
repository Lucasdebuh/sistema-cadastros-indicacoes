import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Copy,
  Hash,
  Phone,
  Share2,
  UserCheck,
  Users,
} from 'lucide-react'
import { useAdmin } from '../../components/AdminLayout'
import { PageLoader } from '../../components/ui/Spinner'
import { buildReferralLink } from '../../lib/referral'
import { displayPhone, formatDate, formatDateTime, initialsOf } from '../../lib/format'

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Phone
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink-400">{label}</p>
        <div className="font-medium break-words">{children}</div>
      </div>
    </div>
  )
}

export default function Person() {
  const { id } = useParams<{ id: string }>()
  const { data, loading } = useAdmin()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const person = useMemo(() => data.find((r) => r.id === id), [data, id])
  const referred = useMemo(
    () =>
      data
        .filter((r) => r.referred_by === id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [data, id]
  )

  if (loading) return <PageLoader label="Carregando perfil..." />

  if (!person) {
    return (
      <div className="card p-10 text-center">
        <p className="font-medium">Cadastro não encontrado</p>
        <button type="button" onClick={() => navigate('/admin/cadastros')} className="btn-primary btn-md mt-5">
          Voltar para a lista
        </button>
      </div>
    )
  }

  const link = buildReferralLink(person.referral_code)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignora */
    }
  }

  return (
    <div className="space-y-5">
      <Link
        to="/admin/cadastros"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Voltar para os cadastros
      </Link>

      {/* ---------- Cabeçalho ---------- */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-xl font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            {initialsOf(person.name)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight break-words">{person.name}</h1>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Cadastrado em {formatDateTime(person.created_at)}
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center dark:bg-emerald-950/60">
              <p className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                {person.referral_count}
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400">indicações</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ---------- Dados ---------- */}
        <section className="card p-6">
          <h2 className="mb-2 font-semibold">Dados do cadastro</h2>
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            <InfoRow icon={Phone} label="Telefone / WhatsApp">
              <a
                href={`https://wa.me/55${person.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tabular-nums hover:text-brand-600"
              >
                {displayPhone(person.phone)}
              </a>
            </InfoRow>
            <InfoRow icon={CalendarDays} label="Data de nascimento">
              <span className="tabular-nums">{formatDate(person.birth_date)}</span>
            </InfoRow>
            <InfoRow icon={Hash} label="Código de indicação">
              <span className="font-mono">{person.referral_code}</span>
            </InfoRow>
            <InfoRow icon={UserCheck} label="Indicado por">
              {person.referrer_name ? (
                <Link to={`/admin/pessoa/${person.referred_by}`} className="hover:text-brand-600">
                  {person.referrer_name}
                </Link>
              ) : (
                <span className="text-ink-400">Cadastro direto (sem indicação)</span>
              )}
            </InfoRow>
          </div>
        </section>

        {/* ---------- Link ---------- */}
        <section className="card p-6">
          <h2 className="mb-3 font-semibold">Link de indicação</h2>
          <p className="rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 font-mono text-sm break-all dark:border-ink-800 dark:bg-ink-950">
            {link}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={copyLink} className="btn-secondary btn-md">
              {copied ? (
                <>
                  <Check className="size-4 text-emerald-600" aria-hidden /> Copiado
                </>
              ) : (
                <>
                  <Copy className="size-4" aria-hidden /> Copiar link
                </>
              )}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(link)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary btn-md"
            >
              <Share2 className="size-4" aria-hidden /> Enviar no WhatsApp
            </a>
          </div>
        </section>
      </div>

      {/* ---------- Indicados ---------- */}
      <section className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Users className="size-5 text-ink-400" aria-hidden />
          <h2 className="font-semibold">Pessoas indicadas por {person.name.split(' ')[0]}</h2>
          <span className="chip bg-ink-100 tabular-nums dark:bg-ink-800">{referred.length}</span>
        </div>

        {referred.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-400">
            Esta pessoa ainda não indicou ninguém.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-left dark:border-ink-800">
                  <th className="py-2.5 pr-4 font-semibold">Nome</th>
                  <th className="py-2.5 pr-4 font-semibold">Telefone</th>
                  <th className="py-2.5 pr-4 font-semibold">Data do cadastro</th>
                  <th className="py-2.5 text-center font-semibold">Indicou</th>
                </tr>
              </thead>
              <tbody>
                {referred.map((r) => (
                  <tr key={r.id} className="border-b border-ink-100 last:border-0 dark:border-ink-800/70">
                    <td className="py-2.5 pr-4">
                      <Link to={`/admin/pessoa/${r.id}`} className="font-medium hover:text-brand-600">
                        {r.name}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums text-ink-600 dark:text-ink-300">
                      {displayPhone(r.phone)}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums text-ink-600 dark:text-ink-300">
                      {formatDateTime(r.created_at)}
                    </td>
                    <td className="py-2.5 text-center tabular-nums text-ink-600 dark:text-ink-300">
                      {r.referral_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
