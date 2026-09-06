/** Mantém apenas dígitos */
export const onlyDigits = (v: string): string => v.replace(/\D/g, '')

/** Aplica a máscara brasileira: (22) 99999-9999 */
export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Formata um telefone salvo (somente dígitos) para exibição */
export function displayPhone(digits: string): string {
  return maskPhone(digits ?? '')
}

/** Valida telefone brasileiro (fixo com 10 ou celular com 11 dígitos) */
export function isValidPhone(value: string): boolean {
  const d = onlyDigits(value)
  if (d.length !== 10 && d.length !== 11) return false
  if (Number(d.slice(0, 2)) < 11) return false
  if (d.length === 11 && d[2] !== '9') return false
  if (/^(\d)\1+$/.test(d)) return false
  return true
}

/** Nome precisa ter ao menos duas palavras */
export function isValidName(value: string): boolean {
  const n = value.trim().replace(/\s+/g, ' ')
  if (n.length < 3 || n.length > 120) return false
  if (!n.includes(' ')) return false
  return /^[\p{L}\p{M}'.\- ]+$/u.test(n)
}

export const MIN_AGE = 16
export const MAX_AGE = 120

export function ageFrom(iso: string): number | null {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return age
}

export function isValidBirthDate(iso: string): boolean {
  const age = ageFrom(iso)
  if (age === null) return false
  const d = new Date(`${iso}T00:00:00`)
  if (d > new Date()) return false
  return age >= MIN_AGE && age <= MAX_AGE
}

/** 2026-03-14 -> 14/03/2026 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-'
  const datePart = iso.slice(0, 10)
  const [y, m, d] = datePart.split('-')
  if (!y || !m || !d) return '-'
  return `${d}/${m}/${y}`
}

/** ISO -> 14/03/2026 às 09:32 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Nome próprio com iniciais maiúsculas */
export function titleCase(value: string): string {
  const small = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])
  return value
    .toLocaleLowerCase('pt-BR')
    .split(' ')
    .map((w, i) =>
      small.has(w) && i > 0 ? w : w.charAt(0).toLocaleUpperCase('pt-BR') + w.slice(1)
    )
    .join(' ')
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toLocaleUpperCase('pt-BR')
}

/** Remove acentos para busca */
export const normalize = (v: string): string =>
  v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
