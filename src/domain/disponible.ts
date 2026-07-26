import { contarOcurrenciasDiaSemana, ocurreEsteMes } from './month'
import { estaActivaEnMes } from './msi'
import { CompraMsi, GastoFijo, IngresoFijo, MonthSlice, YearMonth } from './types'

/** En proyección se usa el monto alto de un rango (conservador); en lo ya ocurrido, el real. */
export function montoOcurrenciaGastoFijo(gasto: GastoFijo, usarValorAlto: boolean): number {
  return usarValorAlto ? gasto.montoMax : gasto.montoMin
}

export function totalGastoFijoEnMes(gasto: GastoFijo, ym: YearMonth, usarValorAlto: boolean): number {
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

  const disponible =
    ingresos -
    gastosFijos -
    msiTotal -
    input.reservaAporteMes -
    input.variablesDelMes +
    input.colchonEntrante

  return {
    ym: input.ym,
    ingresos,
    gastosFijos,
    msiTotal,
    reservaAporte: input.reservaAporteMes,
    variablesGastados: input.variablesDelMes,
    colchonEntrante: input.colchonEntrante,
    disponible,
    enRojo: disponible < 0,
  }
}
