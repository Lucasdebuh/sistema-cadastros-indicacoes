import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  Filter,
  Link2,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useAdmin } from '../../components/AdminLayout'
import { Modal } from '../../components/ui/Modal'
import { PageLoader, Spinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/Toast'
import { supabase } from '../../lib/supabase'
import { exportCsv, exportXlsx } from '../../lib/export'
import { buildReferralLink } from '../../lib/referral'
import {
  displayPhone,
  formatDate,
  formatDateTime,
  initialsOf,
  isValidBirthDate,
  isValidName,
  isValidPhone,
  maskPhone,
  normalize,
  onlyDigits,
} from '../../lib/format'
import type { Registration } from '../../types'

type Period = 'all' | 'today' | '7d' | '30d' | 'month' | 'custom'
type RefFilter = 'all' | 'with' | 'without'

export default function People() {
  const { data, loading, error, reload } = useAdmin()
  const toast = useToast()

  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<Period>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [refFilter, setRefFilter] = useState<RefFilter>('all')
  const [referrerId, setReferrerId] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [editing, setEditing] = useState<Registration | null>(null)
  const [deleting, setDeleting] = useState<Registration | null>(null)

  // Lista de quem já indicou alguém, para o filtro
  const referrers = useMemo(
    () =>
      data
        .filter((r) => r.referral_count > 0)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [data]
  )

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    const qDigits = onlyDigits(query)

    const now = new Date()
    let start: Date | null = null
    let end: Date | null = null

    if (period === 'today') {
      start = new Date(now)
      start.setHours(0, 0, 0, 0)
    } else if (period === '7d') {
      start = new Date(now)
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)
    } else if (period === '30d') {
      start = new Date(now)
      start.setDate(start.getDate() - 29)
      start.setHours(0, 0, 0, 0)
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (period === 'custom') {
      if (from) start = new Date(`${from}T00:00:00`)
      if (to) end = new Date(`${to}T23:59:59`)
    }

    return data.filter((r) => {
      if (q) {
        const matchName = normalize(r.name).includes(q)
        const matchCode = r.referral_code.toLowerCase().includes(query.trim().toLowerCase())
        const matchPhone = qDigits.length >= 3 && r.phone.includes(qDigits)
        if (!matchName && !matchCode && !matchPhone) return false
      }

      const created = new Date(r.created_at)
      if (start && created < start) return false
      if (end && created > end) return false

      if (refFilter === 'with' && !r.referred_by) return false
      if (refFilter === 'without' && r.referred_by) return false
      if (referrerId && r.referred_by !== referrerId) return false

      return true
    })
  }, [data, query, period, from, to, refFilter, referrerId])

  const hasActiveFilters =
    period !== 'all' || refFilter !== 'all' || referrerId !== '' || query.trim() !== ''

  function clearFilters() {
    setQuery('')
    setPeriod('all')
    setFrom('')
    setTo('')
    setRefFilter('all')
    setReferrerId('')
  }

  async function copyLink(r: Registration) {
    try {
      await navigator.clipboard.writeText(buildReferralLink(r.referral_code))
      setCopiedId(r.id)
      window.setTimeout(() => setCopiedId(null), 1800)
    } catch {
      toast.error('Não foi possível copiar o link.')
    }
  }

  async function handleExportXlsx() {
    try {
      await exportXlsx(filtered)
      toast.success(`${filtered.length} cadastro(s) exportado(s) para Excel.`)
    } catch {
      toast.error('Falha ao gerar o arquivo Excel.')
    }
  }

  if (loading) return <PageLoader label="Carregando cadastros..." />
  if (error) return <div className="card p-6 text-center text-sm text-red-600">{error}</div>

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cadastros</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {filtered.length === data.length
              ? `${data.length} pessoa(s) cadastrada(s)`
              : `${filtered.length} de ${data.length} cadastro(s)`}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportCsv(filtered)}
            className="btn-secondary btn-sm"
            disabled={filtered.length === 0}
          >
            <Download className="size-4" aria-hidden />
            CSV
          </button>
          <button
            type="button"
            onClick={handleExportXlsx}
            className="btn-secondary btn-sm"
            disabled={filtered.length === 0}
          >
            <FileSpreadsheet className="size-4" aria-hidden />
            Excel
          </button>
        </div>
      </div>

      {/* ---------- Busca e filtros ---------- */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-400"
              aria-hidden
            />
            <input
              type="search"
              className="input pl-12"
              placeholder="Buscar por nome, telefone ou código..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar cadastros"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className={`btn-md shrink-0 ${showFilters || hasActiveFilters ? 'btn-primary' : 'btn-secondary'}`}
            aria-expanded={showFilters}
          >
            <Filter className="size-4" aria-hidden />
            Filtros
          </button>
        </div>

        {showFilters && (
          <div className="animate-[var(--animate-fade-in)] mt-4 grid gap-4 border-t border-ink-200 pt-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-ink-800">
            <div>
              <label htmlFor="f-period" className="label">
                Período
              </label>
              <select
                id="f-period"
                className="input"
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
              >
                <option value="all">Todo o período</option>
                <option value="today">Hoje</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="month">Mês atual</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            {period === 'custom' && (
              <>
                <div>
                  <label htmlFor="f-from" className="label">
                    De
                  </label>
                  <input
                    id="f-from"
                    type="date"
                    className="input"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="f-to" className="label">
                    Até
                  </label>
                  <input
                    id="f-to"
                    type="date"
                    className="input"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="f-ref" className="label">
                Indicação
              </label>
              <select
                id="f-ref"
                className="input"
                value={refFilter}
                onChange={(e) => setRefFilter(e.target.value as RefFilter)}
              >
                <option value="all">Todos</option>
                <option value="with">Somente indicados</option>
                <option value="without">Somente sem indicação</option>
              </select>
            </div>

            <div>
              <label htmlFor="f-by" className="label">
                Quem indicou
              </label>
              <select
                id="f-by"
                className="input"
                value={referrerId}
                onChange={(e) => setReferrerId(e.target.value)}
              >
                <option value="">Qualquer pessoa</option>
                {referrers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.referral_count})
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <div className="flex items-end">
                <button type="button" onClick={clearFilters} className="btn-ghost btn-md">
                  <X className="size-4" aria-hidden />
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-medium">Nenhum cadastro encontrado</p>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {data.length === 0
              ? 'Assim que alguém se cadastrar, os dados aparecem aqui.'
              : 'Tente ajustar a busca ou os filtros.'}
          </p>
        </div>
      ) : (
        <>
          {/* ---------- Tabela (desktop) ---------- */}
          <div className="card hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50 text-left dark:border-ink-800 dark:bg-ink-950/60">
                    <th className="px-4 py-3 font-semibold">Nome</th>
                    <th className="px-4 py-3 font-semibold">Nascimento</th>
                    <th className="px-4 py-3 font-semibold">Telefone</th>
                    <th className="px-4 py-3 font-semibold">Cadastro</th>
                    <th className="px-4 py-3 font-semibold">Código</th>
                    <th className="px-4 py-3 font-semibold">Quem indicou</th>
                    <th className="px-4 py-3 text-center font-semibold">Indicou</th>
                    <th className="px-4 py-3 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-ink-100 last:border-0 hover:bg-ink-50 dark:border-ink-800/70 dark:hover:bg-ink-800/40"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/pessoa/${r.id}`}
                          className="flex items-center gap-2.5 font-medium text-ink-900 hover:text-brand-600 dark:text-ink-100"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                            {initialsOf(r.name)}
                          </span>
                          <span className="line-clamp-1">{r.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ink-600 dark:text-ink-300">
                        {formatDate(r.birth_date)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ink-600 dark:text-ink-300">
                        {displayPhone(r.phone)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ink-600 dark:text-ink-300">
                        {formatDateTime(r.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="chip bg-ink-100 font-mono text-ink-700 dark:bg-ink-800 dark:text-ink-200">
                          {r.referral_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-600 dark:text-ink-300">
                        {r.referrer_name ? (
                          <Link
                            to={`/admin/pessoa/${r.referred_by}`}
                            className="line-clamp-1 hover:text-brand-600"
                          >
                            {r.referrer_name}
                          </Link>
                        ) : (
                          <span className="text-ink-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`chip tabular-nums ${
                            r.referral_count > 0
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'
                          }`}
                        >
                          {r.referral_count}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => void copyLink(r)}
                            className="btn-ghost btn-sm !px-2"
                            title="Copiar link de indicação"
                            aria-label={`Copiar link de ${r.name}`}
                          >
                            {copiedId === r.id ? (
                              <Check className="size-4 text-emerald-600" aria-hidden />
                            ) : (
                              <Link2 className="size-4" aria-hidden />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(r)}
                            className="btn-ghost btn-sm !px-2"
                            title="Editar"
                            aria-label={`Editar ${r.name}`}
                          >
                            <Pencil className="size-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(r)}
                            className="btn-ghost btn-sm !px-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                            title="Excluir"
                            aria-label={`Excluir ${r.name}`}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ---------- Cartões (celular e tablet) ---------- */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {initialsOf(r.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/admin/pessoa/${r.id}`}
                      className="line-clamp-1 font-semibold hover:text-brand-600"
                    >
                      {r.name}
                    </Link>
                    <p className="mt-0.5 text-sm tabular-nums text-ink-500 dark:text-ink-400">
                      {displayPhone(r.phone)}
                    </p>
                  </div>
                  <span
                    className={`chip shrink-0 tabular-nums ${
                      r.referral_count > 0
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'
                    }`}
                  >
                    {r.referral_count} ind.
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-ink-100 pt-3 text-sm dark:border-ink-800">
                  <div>
                    <dt className="text-xs text-ink-400">Nascimento</dt>
                    <dd className="tabular-nums">{formatDate(r.birth_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-400">Cadastro</dt>
                    <dd className="tabular-nums">{formatDate(r.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-400">Código</dt>
                    <dd className="font-mono">{r.referral_code}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-ink-400">Quem indicou</dt>
                    <dd className="line-clamp-1">{r.referrer_name ?? '-'}</dd>
                  </div>
                </dl>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void copyLink(r)}
                    className="btn-secondary btn-sm flex-1"
                  >
                    {copiedId === r.id ? (
                      <>
                        <Check className="size-4 text-emerald-600" aria-hidden /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="size-4" aria-hidden /> Link
                      </>
                    )}
                  </button>
                  <button type="button" onClick={() => setEditing(r)} className="btn-secondary btn-sm flex-1">
                    <Pencil className="size-4" aria-hidden /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(r)}
                    className="btn-secondary btn-sm !px-3 text-red-600"
                    aria-label={`Excluir ${r.name}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <EditModal
        person={editing}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null)
          await reload()
          toast.success('Cadastro atualizado.')
        }}
        onError={(m) => toast.error(m)}
      />

      <DeleteModal
        person={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={async () => {
          setDeleting(null)
          await reload()
          toast.success('Cadastro excluído.')
        }}
        onError={(m) => toast.error(m)}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Modal de edição                                                    */
/* ------------------------------------------------------------------ */
function EditModal({
  person,
  onClose,
  onSaved,
  onError,
}: {
  person: Registration | null
  onClose: () => void
  onSaved: () => Promise<void>
  onError: (m: string) => void
}) {
  const [name, setName] = useState('')
  const [birth, setBirth] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadedId, setLoadedId] = useState<string | null>(null)

  // Carrega os valores quando um novo registro é aberto
  if (person && person.id !== loadedId) {
    setLoadedId(person.id)
    setName(person.name)
    setBirth(person.birth_date.slice(0, 10))
    setPhone(displayPhone(person.phone))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!person || saving) return

    if (!isValidName(name)) return onError('Informe nome e sobrenome.')
    if (!isValidBirthDate(birth)) return onError('Data de nascimento inválida.')
    if (!isValidPhone(phone)) return onError('Telefone inválido.')

    setSaving(true)
    const { error } = await supabase
      .from('registrations')
      .update({
        name: name.trim().replace(/\s+/g, ' '),
        birth_date: birth,
        phone: onlyDigits(phone),
      })
      .eq('id', person.id)
    setSaving(false)

    if (error) {
      onError(
        error.code === '23505'
          ? 'Já existe outro cadastro com este telefone.'
          : 'Não foi possível salvar as alterações.'
      )
      return
    }
    await onSaved()
  }

  return (
    <Modal
      open={Boolean(person)}
      title="Editar cadastro"
      description={person?.name}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary btn-md">
            Cancelar
          </button>
          <button type="submit" form="edit-form" className="btn-primary btn-md" disabled={saving}>
            {saving && <Spinner className="size-4" />}
            Salvar alterações
          </button>
        </>
      }
    >
      <form id="edit-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="e-name" className="label">
            Nome completo
          </label>
          <input
            id="e-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
          />
        </div>
        <div>
          <label htmlFor="e-birth" className="label">
            Data de nascimento
          </label>
          <input
            id="e-birth"
            type="date"
            className="input"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="e-phone" className="label">
            Telefone
          </label>
          <input
            id="e-phone"
            type="tel"
            inputMode="numeric"
            className="input"
            value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value))}
          />
        </div>
        <p className="text-xs text-ink-500 dark:text-ink-400">
          O código de indicação e quem indicou não são alterados para preservar a rede.
        </p>
      </form>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/*  Modal de exclusão                                                  */
/* ------------------------------------------------------------------ */
function DeleteModal({
  person,
  onClose,
  onDeleted,
  onError,
}: {
  person: Registration | null
  onClose: () => void
  onDeleted: () => Promise<void>
  onError: (m: string) => void
}) {
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!person || deleting) return
    setDeleting(true)
    const { error } = await supabase.from('registrations').delete().eq('id', person.id)
    setDeleting(false)
    if (error) {
      onError('Não foi possível excluir o cadastro.')
      return
    }
    setConfirmText('')
    await onDeleted()
  }

  const canDelete = confirmText.trim().toUpperCase() === 'EXCLUIR'

  return (
    <Modal
      open={Boolean(person)}
      title="Excluir cadastro"
      description="Esta ação não pode ser desfeita."
      size="sm"
      onClose={() => {
        setConfirmText('')
        onClose()
      }}
      footer={
        <>
          <button
            type="button"
            onClick={() => {
              setConfirmText('')
              onClose()
            }}
            className="btn-secondary btn-md"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="btn-danger btn-md"
            disabled={!canDelete || deleting}
          >
            {deleting && <Spinner className="size-4" />}
            Excluir definitivamente
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-950/60">
          <p className="font-semibold text-red-900 dark:text-red-200">{person?.name}</p>
          <p className="mt-1 tabular-nums text-red-700 dark:text-red-300">
            {person ? displayPhone(person.phone) : ''}
          </p>
          {person && person.referral_count > 0 && (
            <p className="mt-2 text-red-700 dark:text-red-300">
              Atenção: esta pessoa indicou {person.referral_count} cadastro(s). Eles serão mantidos,
              mas ficarão <strong>sem indicador</strong>.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirm" className="label">
            Digite <strong className="font-mono">EXCLUIR</strong> para confirmar
          </label>
          <input
            id="confirm"
            className="input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            placeholder="EXCLUIR"
          />
        </div>
      </div>
    </Modal>
  )
}
