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
    const msiDelMes = input.comprasMsi.filter((c) => estaActivaEnMes(c, ym))

    const slice = computeMonthSlice({
      ym,
      ingresosFijos: input.ingresosFijos,
      gastosFijos: input.gastosFijos,
      comprasMsi: msiDelMes,
      reservaAporteMes: reservaAporte,
      variablesDelMes: variables,
      colchonEntrante: colchon,
      usarValorAlto: true,
    })

    reservaSaldo = reservaSaldo + reservaAporte - imprevistos
    resultado.push({ ...slice, reservaSaldo })

    colchon = slice.disponible
    ym = addMonths(ym, 1)
  }

  return resultado
}

/** Inyecta una compra MSI hipotética y reproyecta, para el simulador "¿me lo puedo comprar?". */
export function proyectarConCompraHipotetica(
  input: ProjectionInput,
  compraHipotetica: CompraMsi,
): ProjectedMonth[] {
  return projectMonths({
    ...input,
    comprasMsi: [...input.comprasMsi, compraHipotetica],
  })
}
