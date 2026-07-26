import { absoluteMonthIndex, addMonths } from './month'
import { CompraMsi, YearMonth } from './types'

export function calcularMensualidad(montoTotal: number, numMeses: number): number {
  return montoTotal / numMeses
}

export function estaActivaEnMes(compra: CompraMsi, ym: YearMonth): boolean {
  if (!compra.activa) return false
  const offset = absoluteMonthIndex(ym) - absoluteMonthIndex(compra.fechaInicio)
  return offset >= 0 && offset < compra.numMeses
}

export function mesesAfectados(fechaInicio: YearMonth, numMeses: number): YearMonth[] {
  return Array.from({ length: numMeses }, (_, i) => addMonths(fechaInicio, i))
}
