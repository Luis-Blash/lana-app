import { computeMonthSlice } from './disponible'
import { addMonths } from './month'
import { estaActivaEnMes } from './msi'
import { CompraMsi, GastoFijo, IngresoFijo, ProjectedMonth, YearMonth } from './types'

export interface ProjectionInput {
  desde: YearMonth
  meses: number
  colchonInicial: number
  reservaSaldoInicial: number
  ingresosFijos: IngresoFijo[]
  gastosFijos: GastoFijo[]
  comprasMsi: CompraMsi[]
  reservaAportePorMes: (ym: YearMonth) => number
  /** Solo el mes actual tiene variables/imprevistos conocidos; los meses futuros usan 0 (conservador, sin inventar gasto). */
  variablesPorMes?: (ym: YearMonth) => number
  imprevistosPorMes?: (ym: YearMonth) => number
  /** Impacto de ítems de escenario (simulación), por mes. */
  extrasPorMes?: (ym: YearMonth) => number
  /**
   * Si un mes usa el monto alto de los rangos (conservador) o el bajo (lo que ya sabes).
   * Default: siempre conservador. El mes en curso normalmente pasa `false`, porque de ese
   * mes ya se conocen los gastos reales y así cuadra con lo que muestra Inicio.
   */
  usarValorAltoPorMes?: (ym: YearMonth) => boolean
}

export function projectMonths(input: ProjectionInput): ProjectedMonth[] {
  const resultado: ProjectedMonth[] = []
  let colchon = input.colchonInicial
  let reservaSaldo = input.reservaSaldoInicial
  let ym = input.desde

  for (let i = 0; i < input.meses; i++) {
    const reservaAporte = input.reservaAportePorMes(ym)
    const variables = input.variablesPorMes?.(ym) ?? 0
    const imprevistos = input.imprevistosPorMes?.(ym) ?? 0
    const extras = input.extrasPorMes?.(ym) ?? 0
    const usarValorAlto = input.usarValorAltoPorMes?.(ym) ?? true
    const msiDelMes = input.comprasMsi.filter((c) => estaActivaEnMes(c, ym))

    const slice = computeMonthSlice({
      ym,
      ingresosFijos: input.ingresosFijos,
      gastosFijos: input.gastosFijos,
      comprasMsi: msiDelMes,
      reservaAporteMes: reservaAporte,
      variablesDelMes: variables,
      reservaSaldoEntrante: reservaSaldo,
      imprevistosDelMes: imprevistos,
      extrasDelMes: extras,
      colchonEntrante: colchon,
      usarValorAlto,
    })

    // La reserva no baja de cero: el exceso ya se restó del disponible en el slice.
    reservaSaldo = Math.max(reservaSaldo + reservaAporte - imprevistos, 0)
    resultado.push({ ...slice, reservaSaldo })

    colchon = slice.disponible
    ym = addMonths(ym, 1)
  }

  return resultado
}
