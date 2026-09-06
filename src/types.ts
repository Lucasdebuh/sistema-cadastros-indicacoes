export type Registration = {
  id: string
  name: string
  birth_date: string
  phone: string
  referral_code: string
  referred_by: string | null
  referrer_name: string | null
  referrer_code: string | null
  created_at: string
  updated_at: string
  referral_count: number
}

export type RegisterResult =
  | { ok: true; code: 'ok'; referral_code: string; name: string }
  | { ok: false; code: RegisterErrorCode }

export type RegisterErrorCode =
  | 'duplicate_phone'
  | 'invalid_name'
  | 'invalid_phone'
  | 'invalid_birth'
  | 'no_consent'
  | 'network'
  | 'not_configured'
  | 'unknown'

export type RefInfo = { valid: boolean; first_name?: string }
