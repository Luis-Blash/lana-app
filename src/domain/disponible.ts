import { absoluteMonthIndex, contarOcurrenciasDiaSemana, ocurreEsteMes } from './month'
import { estaActivaEnMes } from './msi'
import { CompraMsi, GastoFijo, IngresoFijo, MonthSlice, YearMonth } from './types'

/** null en inicio/fin = para siempre en esa punta. Usado por suscripciones con duración fija. */
export function estaVigenteEnMes(gasto: GastoFijo, ym: YearMonth): boolean {
  const idx = absoluteMonthIndex(ym)
  if (gasto.inicio && idx < absoluteMonthIndex(gasto.inicio)) return false
  if (gasto.fin && idx > absoluteMonthIndex(gasto.fin)) return false
  return true
}

/** En proyección se usa el monto alto de un rango (conservador); en lo ya ocurrido, el real. */
export function montoOcurrenciaGastoFijo(gasto: GastoFijo, usarValorAlto: boolean): number {
  return usarValorAlto ? gasto.montoMax : gasto.montoMin
}

export function totalGastoFijoEnMes(gasto: GastoFijo, ym: YearMonth, usarValorAlto: boolean): number {
  if (!estaVigenteEnMes(gasto, ym)) return 0
  const monto = montoOcurrenciaGastoFijo(gasto, usarValorAlto)
  switch (gasto.frecuencia) {
    case 'mensual':
      return monto
    case 'semanal':
      return monto * contarOcurrenciasDiaSemana(ym, gasto.diaSemana ?? 0)
    case 'cada_n_meses':
      return ocurreEsteMes(ym, gasto.mesAncla ?? ym.mes, gasto.cadaNMeses ?? 1) ? monto : 0
  }
}

export interface MonthInputs {
  ym: YearMonth
  ingresosFijos: IngresoFijo[]
  gastosFijos: GastoFijo[]
  comprasMsi: CompraMsi[]
  reservaAporteMes: number
  variablesDelMes: number
  /** Reserva que traías al empezar el mes (antes del aporte de este mes). */
  reservaSaldoEntrante?: number
  /** Gastos marcados como imprevisto en el mes. Se cubren primero con la reserva. */
  imprevistosDelMes?: number
  /** Impacto de ítems de escenario (simulación) en este mes. */
  extrasDelMes?: number
  colchonEntrante: number
  usarValorAlto: boolean
}

export function computeMonthSlice(input: MonthInputs): MonthSlice {
  const ingresos = input.ingresosFijos.reduce((sum, i) => sum + i.monto, 0)
  const gastosFijos = input.gastosFijos.reduce(
    (sum, g) => sum + totalGastoFijoEnMes(g, input.ym, input.usarValorAlto),
    0,
  )
  const msiTotal = input.comprasMsi
    .filter((c) => estaActivaEnMes(c, input.ym))
    .reduce((sum, c) => sum + c.mensualidad, 0)

  // Los imprevistos salen primero de la reserva (saldo previo + aporte del mes).
  // Lo que la reserva NO alcance a cubrir sí baja el disponible real.
  const fondoDisponible = Math.max((input.reservaSaldoEntrante ?? 0) + input.reservaAporteMes, 0)
  const imprevistos = input.imprevistosDelMes ?? 0
  const imprevistosExceso = Math.max(imprevistos - fondoDisponible, 0)
  const extras = input.extrasDelMes ?? 0

  const saldoDelMes =
    ingresos -
    gastosFijos -
    msiTotal -
    input.reservaAporteMes -
    input.variablesDelMes -
    imprevistosExceso -
    extras

  const disponible = saldoDelMes + input.colchonEntrante

  return {
    ym: input.ym,
    ingresos,
    gastosFijos,
    msiTotal,
    reservaAporte: input.reservaAporteMes,
    variablesGastados: input.variablesDelMes,
    imprevistosExceso,
    extras,
    colchonEntrante: input.colchonEntrante,
    saldoDelMes,
    enRojoDelMes: saldoDelMes < 0,
    disponible,
    enRojo: disponible < 0,
  }
}
