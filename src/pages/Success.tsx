import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, CheckCircle2, Copy, Share2, Sparkles } from 'lucide-react'
import { PublicLayout } from '../components/PublicLayout'
import { site } from '../config/site'
import { buildReferralLink, getMyRegistration } from '../lib/referral'
import { titleCase } from '../lib/format'

export default function Success() {
  const navigate = useNavigate()
  const me = useMemo(() => getMyRegistration(), [])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!me) navigate('/', { replace: true })
  }, [me, navigate])

  if (!me) return null

  const link = buildReferralLink(me.code)
  const firstName = titleCase(me.name.split(' ')[0] ?? '')

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    site.whatsappMessage.replace('{link}', link)
  )}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // Navegadores sem permissão de área de transferência
      const el = document.createElement('textarea')
      el.value = link
      el.setAttribute('readonly', '')
      el.style.position = 'absolute'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2200)
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: site.name,
          text: site.whatsappMessage.replace('{link}', ''),
          url: link,
        })
        return
      } catch {
        /* usuário cancelou */
      }
    }
    window.open(whatsappUrl, '_blank', 'noopener')
  }

  return (
    <PublicLayout>
      <div className="animate-[var(--animate-fade-up)] card overflow-hidden p-6 text-center sm:p-8">
        <div className="animate-[var(--animate-pop)] mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <CheckCircle2 className="size-9" aria-hidden />
        </div>

        <h1 className="mt-5 text-2xl font-bold tracking-tight">Cadastro realizado!</h1>
        <p className="mt-2 text-ink-500 dark:text-ink-400">
          Tudo certo, <strong className="font-semibold text-ink-800 dark:text-ink-200">{firstName}</strong>.
          Seus dados foram registrados com sucesso.
        </p>

        <div className="mt-7 rounded-2xl border border-brand-200 bg-brand-50 p-5 text-left dark:border-brand-900 dark:bg-brand-950/50">
          <div className="flex items-center gap-2 text-brand-800 dark:text-brand-200">
            <Sparkles className="size-4.5 shrink-0" aria-hidden />
            <p className="text-sm font-semibold">Seu link de indicação</p>
          </div>

          <p className="mt-3 rounded-xl border border-brand-200 bg-white px-4 py-3 font-mono text-sm break-all text-brand-900 dark:border-brand-900 dark:bg-ink-950 dark:text-brand-200">
            {link}
          </p>

          <p className="mt-3 text-xs text-brand-700 dark:text-brand-300">
            Seu código: <strong className="font-mono font-bold">{me.code}</strong> &middot; quem se
            cadastrar por este link conta como sua indicação.
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          <button type="button" onClick={nativeShare} className="btn-lg w-full bg-[#25D366] font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[#1eb455] active:scale-[0.98] inline-flex items-center justify-center gap-2 rounded-xl">
            <Share2 className="size-5" aria-hidden />
            Compartilhar no WhatsApp
          </button>

          <button type="button" onClick={copyLink} className="btn-secondary btn-lg w-full">
            {copied ? (
              <>
                <Check className="size-5 text-emerald-600" aria-hidden />
                Link copiado!
              </>
            ) : (
              <>
                <Copy className="size-5" aria-hidden />
                Copiar link
              </>
            )}
          </button>
        </div>

        <p className="mt-6 text-xs text-ink-500 dark:text-ink-400">
          Guarde este link. Você pode reabrir esta página a qualquer momento neste mesmo navegador.
        </p>

        <Link to="/" className="mt-4 inline-block text-sm font-medium text-brand-600 underline underline-offset-4 hover:text-brand-700">
          Fazer outro cadastro
        </Link>
      </div>
    </PublicLayout>
  )
}
