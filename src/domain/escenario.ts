import { absoluteMonthIndex } from './month'
import { EscenarioItem, YearMonth } from './types'

export function mensualidadEscenario(item: EscenarioItem): number {
  if (item.tipo === 'meses') return item.monto / item.numMeses
  return item.monto
}

export function impactoEnMes(item: EscenarioItem, ym: YearMonth): number {
  if (!item.activo) return 0
  const offset = absoluteMonthIndex(ym) - absoluteMonthIndex(item.inicio)
  if (offset < 0 || offset >= item.numMeses) return 0

  switch (item.tipo) {
    case 'unico':
      return offset === 0 ? item.monto : 0
    case 'meses':
      return item.monto / item.numMeses
    case 'recurrente':
      return item.monto
  }
}

export function impactoTotalEnMes(items: EscenarioItem[], ym: YearMonth): number {
  return items.reduce((sum, item) => sum + impactoEnMes(item, ym), 0)
}
