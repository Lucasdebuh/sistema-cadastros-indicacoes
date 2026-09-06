import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Loader2, Phone, ShieldCheck, User, UserCheck } from 'lucide-react'
import { PublicLayout } from '../components/PublicLayout'
import { site } from '../config/site'
import { supabase, isConfigured } from '../lib/supabase'
import {
  isValidBirthDate,
  isValidName,
  isValidPhone,
  maskPhone,
  onlyDigits,
  MIN_AGE,
} from '../lib/format'
import { captureRefFromUrl, clearRef, saveMyRegistration } from '../lib/referral'
import type { RefInfo, RegisterErrorCode } from '../types'

const ERROR_MESSAGES: Record<RegisterErrorCode, string> = {
  duplicate_phone: 'Este telefone já está cadastrado.',
  invalid_name: 'Informe seu nome completo (nome e sobrenome).',
  invalid_phone: 'Telefone inválido. Confira o DDD e o número.',
  invalid_birth: `Data de nascimento inválida. É necessário ter ao menos ${MIN_AGE} anos.`,
  no_consent: 'É preciso autorizar o uso dos dados para concluir.',
  network: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
  not_configured: 'O sistema ainda está sendo configurado. Tente novamente mais tarde.',
  unknown: 'Não foi possível concluir o cadastro. Tente novamente.',
}

type Fields = { name: string; birth: string; phone: string }
type FieldErrors = Partial<Record<keyof Fields | 'consent', string>>

export default function Register() {
  const navigate = useNavigate()
  const [fields, setFields] = useState<Fields>({ name: '', birth: '', phone: '' })
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [ref, setRef] = useState<string | null>(null)
  const [refInfo, setRefInfo] = useState<RefInfo | null>(null)
  const honeypot = useRef<HTMLInputElement>(null)
  const submitLock = useRef(false)

  // Captura ?ref= e valida quem indicou
  useEffect(() => {
    const code = captureRefFromUrl()
    setRef(code)
    if (!code || !isConfigured) return

    let active = true
    supabase
      .rpc('validate_ref', { p_code: code })
      .then(({ data, error }) => {
        if (!active || error) return
        setRefInfo(data as RefInfo)
      })

    return () => {
      active = false
    }
  }, [])

  const setField = (key: keyof Fields, value: string) => {
    setFields((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
    setFormError(null)
  }

  function validate(): boolean {
    const next: FieldErrors = {}
    if (!isValidName(fields.name)) next.name = 'Informe nome e sobrenome.'
    if (!fields.birth) next.birth = 'Informe sua data de nascimento.'
    else if (!isValidBirthDate(fields.birth))
      next.birth = `Data inválida. É necessário ter ao menos ${MIN_AGE} anos.`
    if (!isValidPhone(fields.phone)) next.phone = 'Telefone inválido. Ex.: (22) 99999-9999'
    if (!consent) next.consent = 'Marque a autorização para continuar.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting || submitLock.current) return
    setFormError(null)

    // Campo armadilha: preenchido apenas por robôs
    if (honeypot.current?.value) {
      navigate('/meu-link')
      return
    }

    if (!validate()) return

    if (!isConfigured) {
      setFormError(ERROR_MESSAGES.not_configured)
      return
    }

    submitLock.current = true
    setSubmitting(true)

    try {
      const { data, error } = await supabase.rpc('public_register', {
        p_name: fields.name.trim().replace(/\s+/g, ' '),
        p_birth_date: fields.birth,
        p_phone: onlyDigits(fields.phone),
        p_ref: ref,
        p_consent: true,
      })

      if (error) {
        setFormError(ERROR_MESSAGES.network)
        return
      }

      const result = data as { ok: boolean; code: RegisterErrorCode; referral_code?: string }

      if (!result?.ok) {
        const code = (result?.code ?? 'unknown') as RegisterErrorCode
        setFormError(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.unknown)
        if (code === 'duplicate_phone') setErrors({ phone: ERROR_MESSAGES.duplicate_phone })
        return
      }

      saveMyRegistration({
        name: fields.name.trim().replace(/\s+/g, ' '),
        code: result.referral_code as string,
      })
      clearRef()
      navigate('/meu-link', { replace: true })
    } catch {
      setFormError(ERROR_MESSAGES.network)
    } finally {
      setSubmitting(false)
      submitLock.current = false
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <PublicLayout>
      {refInfo?.valid && (
        <div className="animate-[var(--animate-fade-up)] mb-4 flex items-center gap-3 rounded-2xl border border-white/25 bg-white/15 px-4 py-3 text-white backdrop-blur-sm">
          <UserCheck className="size-5 shrink-0" aria-hidden />
          <p className="text-sm">
            Você foi convidado por <strong className="font-semibold">{refInfo.first_name}</strong>
          </p>
        </div>
      )}

      <div className="animate-[var(--animate-fade-up)] card p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{site.formTitle}</h1>
        <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
          Leva menos de um minuto. Todos os campos são obrigatórios.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          {/* Campo armadilha invisível para robôs */}
          <input
            ref={honeypot}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="absolute -left-[9999px] size-0 opacity-0"
          />

          <div>
            <label htmlFor="name" className="label">
              Nome completo
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-400"
                aria-hidden
              />
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                enterKeyHint="next"
                placeholder="Seu nome e sobrenome"
                className={`input pl-12 ${errors.name ? 'input-error' : ''}`}
                value={fields.name}
                onChange={(e) => setField('name', e.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'name-error' : undefined}
                maxLength={120}
                required
              />
            </div>
            {errors.name && (
              <p id="name-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="birth" className="label">
              Data de nascimento
            </label>
            <div className="relative">
              <CalendarDays
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-400"
                aria-hidden
              />
              <input
                id="birth"
                name="birth"
                type="date"
                autoComplete="bday"
                max={today}
                min="1906-01-01"
                className={`input pl-12 ${errors.birth ? 'input-error' : ''}`}
                value={fields.birth}
                onChange={(e) => setField('birth', e.target.value)}
                aria-invalid={Boolean(errors.birth)}
                aria-describedby={errors.birth ? 'birth-error' : undefined}
                required
              />
            </div>
            {errors.birth ? (
              <p id="birth-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.birth}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-ink-400">Formato dia / mês / ano</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="label">
              Telefone / WhatsApp
            </label>
            <div className="relative">
              <Phone
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-400"
                aria-hidden
              />
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                enterKeyHint="done"
                placeholder="(22) 99999-9999"
                className={`input pl-12 ${errors.phone ? 'input-error' : ''}`}
                value={fields.phone}
                onChange={(e) => setField('phone', maskPhone(e.target.value))}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
                required
              />
            </div>
            {errors.phone && (
              <p id="phone-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.phone}
              </p>
            )}
          </div>

          <div>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                errors.consent
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/40'
                  : 'border-ink-200 bg-ink-50 hover:bg-ink-100 dark:border-ink-800 dark:bg-ink-950 dark:hover:bg-ink-800'
              }`}
            >
              <input
                type="checkbox"
                className="mt-0.5 size-5 shrink-0 cursor-pointer rounded accent-brand-600"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked)
                  setErrors((x) => ({ ...x, consent: undefined }))
                }}
                aria-describedby={errors.consent ? 'consent-error' : undefined}
              />
              <span className="text-sm leading-relaxed text-ink-700 dark:text-ink-300">
                {site.consentText}
              </span>
            </label>
            {errors.consent && (
              <p id="consent-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.consent}
              </p>
            )}
          </div>

          {formError && (
            <div
              role="alert"
              className="animate-[var(--animate-fade-in)] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
            >
              {formError}
            </div>
          )}

          <button type="submit" className="btn-primary btn-lg w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden />
                Enviando cadastro...
              </>
            ) : (
              'Concluir cadastro'
            )}
          </button>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-ink-500 dark:text-ink-400">
            <ShieldCheck className="size-4 shrink-0" aria-hidden />
            Seus dados ficam protegidos e não aparecem para outras pessoas.
          </p>
        </form>
      </div>
    </PublicLayout>
  )
}
