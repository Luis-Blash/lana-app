import { YearMonth } from './types'

export function absoluteMonthIndex(ym: YearMonth): number {
  return ym.anio * 12 + (ym.mes - 1)
}

export function addMonths(ym: YearMonth, n: number): YearMonth {
  const idx = absoluteMonthIndex(ym) + n
  return { anio: Math.floor(idx / 12), mes: (idx % 12) + 1 }
}

export function monthKey(ym: YearMonth): string {
  return `${ym.anio}-${String(ym.mes).padStart(2, '0')}`
}

export function ultimoDiaDelMes(ym: YearMonth): number {
  return new Date(ym.anio, ym.mes, 0).getDate()
}

/** Día 31 en un mes de 30 (o 28/29) días cae en el último día real del mes. */
export function clampDiaDelMes(ym: YearMonth, dia: number): number {
  return Math.min(dia, ultimoDiaDelMes(ym))
}

/**
 * Cuenta cuántas veces cae un día de la semana (0=domingo..6=sábado) dentro del mes.
 * Los meses tienen 4 o 5 ocurrencias de un mismo día de semana; nunca asumir 4 fijo.
 */
export function contarOcurrenciasDiaSemana(ym: YearMonth, diaSemana: number): number {
  const total = ultimoDiaDelMes(ym)
  let count = 0
  for (let dia = 1; dia <= total; dia++) {
    if (new Date(ym.anio, ym.mes - 1, dia).getDay() === diaSemana) count++
  }
  return count
}

/**
 * Un gasto 'cada_n_meses' solo guarda un mes-ancla (1-12), sin año. Esto asume que
 * cadaNMeses divide a 12 (1,2,3,4,6,12) para que la cadencia sea estable año tras año.
 */
export function ocurreEsteMes(ym: YearMonth, mesAncla: number, cadaNMeses: number): boolean {
  const diff = ym.mes - mesAncla
  return ((diff % cadaNMeses) + cadaNMeses) % cadaNMeses === 0
}
