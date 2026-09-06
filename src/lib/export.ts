import type { SheetData } from 'write-excel-file/browser'
import type { Registration } from '../types'
import { displayPhone, formatDate, formatDateTime } from './format'
import { buildReferralLink } from './referral'

type Row = {
  nome: string
  nascimento: string
  telefone: string
  cadastro: string
  codigo: string
  indicadoPor: string
  indicacoes: number
  link: string
}

function toRows(items: Registration[]): Row[] {
  return items.map((r) => ({
    nome: r.name,
    nascimento: formatDate(r.birth_date),
    telefone: displayPhone(r.phone),
    cadastro: formatDateTime(r.created_at),
    codigo: r.referral_code,
    indicadoPor: r.referrer_name ?? '',
    indicacoes: r.referral_count,
    link: buildReferralLink(r.referral_code),
  }))
}

const HEADERS = [
  'Nome',
  'Nascimento',
  'Telefone',
  'Data do cadastro',
  'Código',
  'Quem indicou',
  'Indicações',
  'Link de indicação',
]

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function stamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`
}

/** Exporta para CSV (abre no Excel com acentos corretos) */
export function exportCsv(items: Registration[]): void {
  const rows = toRows(items)
  const escape = (v: string | number): string => {
    const s = String(v ?? '')
    return `"${s.replace(/"/g, '""')}"`
  }
  const lines = [
    HEADERS.map(escape).join(';'),
    ...rows.map((r) =>
      [r.nome, r.nascimento, r.telefone, r.cadastro, r.codigo, r.indicadoPor, r.indicacoes, r.link]
        .map(escape)
        .join(';')
    ),
  ]
  // BOM garante acentuação correta ao abrir no Excel
  const blob = new Blob(['﻿' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  triggerDownload(blob, `cadastros_${stamp()}.csv`)
}

/** Exporta para Excel (.xlsx) com cabeçalho formatado */
export async function exportXlsx(items: Registration[]): Promise<void> {
  // Importado sob demanda: a biblioteca só entra no navegador ao exportar.
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const rows = toRows(items)

  const header = HEADERS.map((value) => ({
    value,
    type: String,
    fontWeight: 'bold' as const,
    backgroundColor: '#1D4ED8',
    color: '#FFFFFF',
    align: 'left' as const,
  }))

  const body = rows.map((r) => [
    { type: String, value: r.nome },
    { type: String, value: r.nascimento },
    { type: String, value: r.telefone },
    { type: String, value: r.cadastro },
    { type: String, value: r.codigo },
    { type: String, value: r.indicadoPor },
    { type: Number, value: r.indicacoes },
    { type: String, value: r.link },
  ])

  const data = [header, ...body] as SheetData

  const blob = await writeXlsxFile(data, {
    sheet: 'Cadastros',
    columns: [
      { width: 34 },
      { width: 14 },
      { width: 18 },
      { width: 20 },
      { width: 12 },
      { width: 28 },
      { width: 12 },
      { width: 54 },
    ],
  }).toBlob()

  triggerDownload(blob, `cadastros_${stamp()}.xlsx`)
}
