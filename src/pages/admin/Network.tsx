import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, Network as NetworkIcon, Search, User } from 'lucide-react'
import { useAdmin } from '../../components/AdminLayout'
import { PageLoader } from '../../components/ui/Spinner'
import { displayPhone, normalize } from '../../lib/format'
import type { Registration } from '../../types'

type TreeNode = {
  person: Registration
  children: TreeNode[]
  depth: number
  descendants: number
}

/** Monta a árvore de indicações a partir da lista plana */
function buildForest(items: Registration[]): TreeNode[] {
  const byId = new Map<string, Registration>()
  for (const r of items) byId.set(r.id, r)

  const childrenOf = new Map<string | null, Registration[]>()
  for (const r of items) {
    // Se o indicador não existe mais, trata como raiz
    const parent = r.referred_by && byId.has(r.referred_by) ? r.referred_by : null
    const list = childrenOf.get(parent) ?? []
    list.push(r)
    childrenOf.set(parent, list)
  }

  const visited = new Set<string>()

  function build(person: Registration, depth: number): TreeNode {
    visited.add(person.id)
    const kids = (childrenOf.get(person.id) ?? [])
      .filter((c) => !visited.has(c.id))
      .sort((a, b) => b.referral_count - a.referral_count || a.name.localeCompare(b.name, 'pt-BR'))

    const children = kids.map((c) => build(c, depth + 1))
    const descendants = children.reduce((sum, c) => sum + 1 + c.descendants, 0)
    return { person, children, depth, descendants }
  }

  return (childrenOf.get(null) ?? [])
    .map((r) => build(r, 0))
    .sort((a, b) => b.descendants - a.descendants || a.person.name.localeCompare(b.person.name, 'pt-BR'))
}

function NodeRow({ node, defaultOpen }: { node: TreeNode; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const hasChildren = node.children.length > 0

  return (
    <li>
      <div
        className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-ink-50 dark:hover:bg-ink-800/50"
        style={{ marginLeft: node.depth > 0 ? 0 : undefined }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-200 dark:hover:bg-ink-700"
            aria-expanded={open}
            aria-label={open ? `Recolher ${node.person.name}` : `Expandir ${node.person.name}`}
          >
            {open ? <ChevronDown className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}
          </button>
        ) : (
          <span className="flex size-7 shrink-0 items-center justify-center text-ink-300">
            <User className="size-3.5" aria-hidden />
          </span>
        )}

        <Link
          to={`/admin/pessoa/${node.person.id}`}
          className="min-w-0 flex-1 truncate text-sm font-medium hover:text-brand-600"
        >
          {node.person.name}
        </Link>

        <span className="hidden shrink-0 text-xs tabular-nums text-ink-400 sm:inline">
          {displayPhone(node.person.phone)}
        </span>

        {hasChildren && (
          <span className="chip shrink-0 bg-brand-50 tabular-nums text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            {node.children.length}
          </span>
        )}
      </div>

      {hasChildren && open && (
        <ul className="ml-3.5 border-l border-ink-200 pl-3 dark:border-ink-800">
          {node.children.map((child) => (
            <NodeRow key={child.person.id} node={child} defaultOpen={child.depth < 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function Network() {
  const { data, loading } = useAdmin()
  const [query, setQuery] = useState('')
  const [onlyWithNetwork, setOnlyWithNetwork] = useState(true)

  const forest = useMemo(() => buildForest(data), [data])

  const visible = useMemo(() => {
    let list = forest
    if (onlyWithNetwork) list = list.filter((n) => n.children.length > 0)
    const q = normalize(query.trim())
    if (q) list = list.filter((n) => normalize(n.person.name).includes(q))
    return list
  }, [forest, query, onlyWithNetwork])

  if (loading) return <PageLoader label="Montando a rede..." />

  const withNetwork = forest.filter((n) => n.children.length > 0).length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rede de indicações</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Quem trouxe quem, em formato de árvore. Clique nas setas para expandir.
        </p>
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-400"
              aria-hidden
            />
            <input
              type="search"
              className="input pl-12"
              placeholder="Buscar pessoa na raiz da rede..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar na rede"
            />
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl border border-ink-200 px-4 py-3 text-sm dark:border-ink-800">
            <input
              type="checkbox"
              className="size-4.5 cursor-pointer accent-brand-600"
              checked={onlyWithNetwork}
              onChange={(e) => setOnlyWithNetwork(e.target.checked)}
            />
            Somente quem indicou ({withNetwork})
          </label>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card p-12 text-center">
          <NetworkIcon className="mx-auto size-10 text-ink-300" aria-hidden />
          <p className="mt-3 font-medium">Nada para mostrar</p>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {data.length === 0
              ? 'Ainda não há cadastros.'
              : 'Desmarque o filtro para ver todos os cadastros diretos.'}
          </p>
        </div>
      ) : (
        <div className="card p-4">
          <ul className="space-y-0.5">
            {visible.map((node) => (
              <NodeRow key={node.person.id} node={node} defaultOpen />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
