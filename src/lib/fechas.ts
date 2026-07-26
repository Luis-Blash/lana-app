import { addMonths } from '@/domain/month'
import { YearMonth } from '@/domain/types'

export const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function mesActual(): YearMonth {
  const hoy = new Date()
  return { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 }
}

/** El mes anterior es el "ancla": de ahí el mes actual toma sus saldos de arranque. */
export function mesAncla(): YearMonth {
  return addMonths(mesActual(), -1)
}

export function proximosMeses(n: number): YearMonth[] {
  return Array.from({ length: n }, (_, i) => addMonths(mesActual(), i))
}
