import type { SQLiteDatabase } from 'expo-sqlite'
import { create } from 'zustand'

import {
  getComprasMsiActivas,
  getEstadoMensual,
  getGastosFijos,
  getIngresosFijos,
  getReservaAportesEnRango,
  getTransaccionesDelMes,
  insertTransaccion,
} from '@/db/queries'
import { computeMonthSlice } from '@/domain/disponible'
import { calcularMensualidad } from '@/domain/msi'
import { addMonths, monthKey } from '@/domain/month'
import { projectMonths } from '@/domain/projection'
import {
  CompraMsi,
  GastoFijo,
  IngresoFijo,
  MonthSlice,
  ProjectedMonth,
  TipoTransaccion,
  Transaccion,
  YearMonth,
} from '@/domain/types'

const MESES_PROYECCION = 6

function mesActual(): YearMonth {
  const hoy = new Date()
  return { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 }
}

interface FinanceState {
  cargando: boolean
  mes: YearMonth
  ingresosFijos: IngresoFijo[]
  gastosFijos: GastoFijo[]
  comprasMsi: CompraMsi[]
  transacciones: Transaccion[]
  slice: MonthSlice | null
  proyeccion: ProjectedMonth[]
  colchonInicial: number
  reservaSaldoInicial: number
  aportesReserva: Map<string, number>
  cargar: (db: SQLiteDatabase) => Promise<void>
  registrarGasto: (
    db: SQLiteDatabase,
    gasto: { monto: number; descripcion: string; tipo: TipoTransaccion },
  ) => Promise<void>
  simularCompra: (montoTotal: number, numMeses: number) => { mensualidad: number; proyeccion: ProjectedMonth[] }
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  cargando: true,
  mes: mesActual(),
  ingresosFijos: [],
  gastosFijos: [],
  comprasMsi: [],
  transacciones: [],
  slice: null,
  proyeccion: [],
  colchonInicial: 0,
  reservaSaldoInicial: 0,
  aportesReserva: new Map(),

  cargar: async (db) => {
    const ym = mesActual()
    const [ingresosFijos, gastosFijos, comprasMsi, transacciones, aportesReserva, estado] = await Promise.all([
      getIngresosFijos(db),
      getGastosFijos(db),
      getComprasMsiActivas(db),
      getTransaccionesDelMes(db, ym),
      getReservaAportesEnRango(db, ym, MESES_PROYECCION),
      getEstadoMensual(db, addMonths(ym, -1)),
    ])

    const variablesDelMes = transacciones.filter((t) => t.tipo === 'variable').reduce((s, t) => s + t.monto, 0)
    const imprevistosDelMes = transacciones.filter((t) => t.tipo === 'imprevisto').reduce((s, t) => s + t.monto, 0)
    const colchonEntrante = estado?.colchonAcumulado ?? 0
    const reservaSaldoInicial = estado?.reservaSaldo ?? 0
    const reservaAporteMes = aportesReserva.get(monthKey(ym)) ?? 0

    const slice = computeMonthSlice({
      ym,
      ingresosFijos,
      gastosFijos,
      comprasMsi,
      reservaAporteMes,
      variablesDelMes,
      colchonEntrante,
      usarValorAlto: false,
    })

    const proyeccion = projectMonths({
      desde: ym,
      meses: MESES_PROYECCION,
      colchonInicial: colchonEntrante,
      reservaSaldoInicial,
      ingresosFijos,
      gastosFijos,
      comprasMsi,
      reservaAportePorMes: (m) => aportesReserva.get(monthKey(m)) ?? 0,
      variablesPorMes: (m) => (monthKey(m) === monthKey(ym) ? variablesDelMes : 0),
      imprevistosPorMes: (m) => (monthKey(m) === monthKey(ym) ? imprevistosDelMes : 0),
    })

    set({
      mes: ym,
      ingresosFijos,
      gastosFijos,
      comprasMsi,
      transacciones,
      slice,
      proyeccion,
      colchonInicial: colchonEntrante,
      reservaSaldoInicial,
      aportesReserva,
      cargando: false,
    })
  },

  registrarGasto: async (db, gasto) => {
    const fecha = new Date().toISOString().slice(0, 10)
    await insertTransaccion(db, { fecha, monto: gasto.monto, descripcion: gasto.descripcion, tipo: gasto.tipo })
    await get().cargar(db)
  },

  simularCompra: (montoTotal, numMeses) => {
    const state = get()
    const mensualidad = calcularMensualidad(montoTotal, numMeses)
    const compraHipotetica: CompraMsi = {
      id: -1,
      descripcion: 'Simulación',
      montoTotal,
      numMeses,
      mensualidad,
      fechaInicio: state.mes,
      activa: true,
    }

    const proyeccion = projectMonths({
      desde: state.mes,
      meses: MESES_PROYECCION,
      colchonInicial: state.colchonInicial,
      reservaSaldoInicial: state.reservaSaldoInicial,
      ingresosFijos: state.ingresosFijos,
      gastosFijos: state.gastosFijos,
      comprasMsi: [...state.comprasMsi, compraHipotetica],
      reservaAportePorMes: (m) => state.aportesReserva.get(monthKey(m)) ?? 0,
    })

    return { mensualidad, proyeccion }
  },
}))
