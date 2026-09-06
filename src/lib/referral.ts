/**
 * Captura e guarda o código de indicação vindo da URL (?ref=CODIGO).
 * O código sobrevive a navegação dentro do site e a recarregamentos,
 * até o cadastro ser concluído.
 */
const REF_KEY = 'cadastro:ref'
const REF_AT_KEY = 'cadastro:ref_at'
const ME_KEY = 'cadastro:me'

/** Indicação expira em 30 dias */
const TTL_MS = 30 * 24 * 60 * 60 * 1000

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* modo privativo / storage bloqueado */
  }
}

function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignora */
  }
}

/** Lê ?ref= da URL, salva e devolve o código (se houver) */
export function captureRefFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  const raw = params.get('ref')
  if (raw) {
    const code = raw.trim().toUpperCase().slice(0, 12)
    if (/^[A-Z0-9]{4,12}$/.test(code)) {
      safeSet(REF_KEY, code)
      safeSet(REF_AT_KEY, String(Date.now()))
      return code
    }
  }
  return getStoredRef()
}

/** Devolve a indicação guardada, respeitando a validade */
export function getStoredRef(): string | null {
  const code = safeGet(REF_KEY)
  if (!code) return null
  const at = Number(safeGet(REF_AT_KEY) ?? '0')
  if (at && Date.now() - at > TTL_MS) {
    clearRef()
    return null
  }
  return code
}

export function clearRef(): void {
  safeRemove(REF_KEY)
  safeRemove(REF_AT_KEY)
}

export type MyRegistration = { name: string; code: string }

/** Guarda o próprio cadastro para a pessoa recuperar o link depois */
export function saveMyRegistration(data: MyRegistration): void {
  safeSet(ME_KEY, JSON.stringify(data))
}

export function getMyRegistration(): MyRegistration | null {
  const raw = safeGet(ME_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as MyRegistration
    if (parsed?.code && parsed?.name) return parsed
    return null
  } catch {
    return null
  }
}

export function clearMyRegistration(): void {
  safeRemove(ME_KEY)
}

/** Monta o link público de indicação a partir do código */
export function buildReferralLink(code: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const origin = window.location.origin
  const path = base.endsWith('/') ? base : `${base}/`
  return `${origin}${path}?ref=${code}`
}
