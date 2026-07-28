export type Frecuencia = 'mensual' | 'semanal' | 'cada_n_meses'

export type TipoTransaccion = 'variable' | 'imprevisto'

export interface YearMonth {
  anio: number
  mes: number // 1-12
}

export interface IngresoFijo {
  id: number
  nombre: string
  monto: number
  diaDelMes: number
}

export interface GastoFijo {
  id: number
  nombre: string
  montoMin: number
  montoMax: number
  frecuencia: Frecuencia
  diaDelMes: number | null
  diaSemana: number | null // 0=domingo ... 6=sábado
  cadaNMeses: number | null
  mesAncla: number | null // 1-12
  /** null = para siempre. Usado por suscripciones/gastos con duración fija (ej. Amazon 3 meses). */
  inicio: YearMonth | null
  fin: YearMonth | null
}

export interface CompraMsi {
  id: number
  descripcion: string
  montoTotal: number
  numMeses: number
  mensualidad: number
  fechaInicio: YearMonth
  activa: boolean
}

export interface Transaccion {
  id: number
  fecha: string
  monto: number
  descripcion: string
  tipo: TipoTransaccion
}

export interface MonthSlice {
  ym: YearMonth
  ingresos: number
  gastosFijos: number
  msiTotal: number
  reservaAporte: number
  variablesGastados: number
  /** Imprevistos que la reserva NO alcanzó a cubrir y sí pegan al disponible. */
  imprevistosExceso: number
  /** Impacto de ítems de escenario (simulación) en este mes. 0 si no hay escenario activo. */
  extras: number
  colchonEntrante: number
  /** Lo que entra menos lo que sale ESTE mes, sin contar el colchón traído de meses anteriores. */
  saldoDelMes: number
  enRojoDelMes: boolean
  disponible: number
  enRojo: boolean
}

export interface ProjectedMonth extends MonthSlice {
  reservaSaldo: number
}

export type TipoEscenario = 'unico' | 'meses' | 'recurrente'

export interface EscenarioItem {
  id: number
  tipo: TipoEscenario
  descripcion: string
  /** 'unico': el gasto | 'meses': monto TOTAL a repartir | 'recurrente': monto MENSUAL */
  monto: number
  /** 1 para 'unico' */
  numMeses: number
  inicio: YearMonth
  activo: boolean
}
