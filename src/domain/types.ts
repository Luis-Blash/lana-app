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
  colchonEntrante: number
  disponible: number
  enRojo: boolean
}

export interface ProjectedMonth extends MonthSlice {
  reservaSaldo: number
}
