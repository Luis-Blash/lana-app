import { YearMonth } from '@/domain/types'

const formatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

export function formatMXN(monto: number): string {
  return formatter.format(monto)
}

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MESES_LARGOS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export function formatMesCorto(ym: YearMonth): string {
  return MESES_CORTOS[ym.mes - 1]
}

export function formatMesLargo(ym: YearMonth): string {
  return `${MESES_LARGOS[ym.mes - 1]} ${ym.anio}`
}

export function formatMontoCorto(monto: number): string {
  const signo = monto < 0 ? '-' : ''
  const abs = Math.abs(monto)
  if (abs >= 1000) return `${signo}$${(abs / 1000).toFixed(1)}k`
  return `${signo}$${Math.round(abs)}`
}
