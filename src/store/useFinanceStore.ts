import type { SQLiteDatabase } from 'expo-sqlite'
import { create } from 'zustand'

import {
  deleteEscenarioItem,
  deleteTransaccion,
  getComprasMsiActivas,
  getEscenarioItems,
  getEstadoMensual,
  getGastosFijos,
  getIngresosFijos,
  getReservaAportesEnRango,
  getTransaccionesEnRango,
  insertCompraMsi,
  insertEscenarioItem,
  insertGastoFijo,
  insertTransaccion,
  limpiarEscenario,
  toggleEscenarioItem,
  updateTransaccion,
} from '@/db/queries'
import { computeMonthSlice } from '@/domain/disponible'
import { impactoTotalEnMes } from '@/domain/escenario'
import { addMonths, absoluteMonthIndex, monthKey } from '@/domain/month'
import { calcularMensualidad } from '@/domain/msi'
import { projectMonths } from '@/domain/projection'
import {
  CompraMsi,
  EscenarioItem,
  GastoFijo,
  IngresoFijo,
  MonthSlice,
  ProjectedMonth,
  TipoEscenario,
  TipoTransaccion,
  Transaccion,
  YearMonth,
} from '@/domain/types'
import { mesActual } from '@/lib/fechas'

const VENTANA_ADELANTE = 12
const VENTANA_ATRAS = 12

function agruparPorMes(transacciones: Transaccion[]): Map<string, Transaccion[]> {
  const map = new Map<string, Transaccion[]>()
  for (const t of transacciones) {
    const key = t.fecha.slice(0, 7)
    const lista = map.get(key) ?? []
    lista.push(t)
    map.set(key, lista)
  }
  return map
}

function totalPorTipo(transacciones: Transaccion[], tipo: TipoTransaccion): number {
  return transacciones.filter((t) => t.tipo === tipo).reduce((s, t) => s + t.monto, 0)
}

interface FinanceState {
  cargando: boolean
  mesVisible: YearMonth
  ingresosFijos: IngresoFijo[]
  gastosFijos: GastoFijo[]
  comprasMsi: CompraMsi[]
  escenario: EscenarioItem[]
  escenarioActivo: boolean
  transaccionesPorMes: Map<string, Transaccion[]>
  aportesReserva: Map<string, number>
  proyeccionBase: ProjectedMonth[]
  proyeccionEscenario: ProjectedMonth[]
  historialPorMes: Map<string, MonthSlice>
  colchonInicial: number
  reservaSaldoInicial: number
  sliceVisible: MonthSlice | null
  extrasVisible: number
  transaccionesVisibles: Transaccion[]

  cargar: (db: SQLiteDatabase) => Promise<void>
  irAMes: (ym: YearMonth) => void
  mesAnterior: () => void
  mesSiguiente: () => void
  volverAHoy: () => void
  setEscenarioActivo: (activo: boolean) => void

  registrarGasto: (
    db: SQLiteDatabase,
    gasto: { monto: number; descripcion: string; tipo: TipoTransaccion; fecha: string },
  ) => Promise<void>
  editarGasto: (
    db: SQLiteDatabase,
    id: number,
    gasto: { monto: number; descripcion: string; tipo: TipoTransaccion; fecha: string },
  ) => Promise<void>
  eliminarGasto: (db: SQLiteDatabase, id: number) => Promise<void>

  agregarItemEscenario: (
    db: SQLiteDatabase,
    item: { tipo: TipoEscenario; descripcion: string; monto: number; numMeses: number; inicio: YearMonth },
  ) => Promise<void>
  toggleItemEscenario: (db: SQLiteDatabase, id: number, activo: boolean) => Promise<void>
  eliminarItemEscenario: (db: SQLiteDatabase, id: number) => Promise<void>
  limpiarEscenarioAction: (db: SQLiteDatabase) => Promise<void>
  hacerRealItem: (db: SQLiteDatabase, id: number) => Promise<void>
}

function calcularSliceVisible(state: {
  mesVisible: YearMonth
  ingresosFijos: IngresoFijo[]
  gastosFijos: GastoFijo[]
  comprasMsi: CompraMsi[]
  transaccionesPorMes: Map<string, Transaccion[]>
  aportesReserva: Map<string, number>
  proyeccionBase: ProjectedMonth[]
  historialPorMes: Map<string, MonthSlice>
  colchonInicial: number
  reservaSaldoInicial: number
}): MonthSlice | null {
  const ym = state.mesVisible
  const key = monthKey(ym)
  const hoy = mesActual()

  if (absoluteMonthIndex(ym) < absoluteMonthIndex(hoy)) {
    return state.historialPorMes.get(key) ?? null
  }

  if (absoluteMonthIndex(ym) === absoluteMonthIndex(hoy)) {
    const transacciones = state.transaccionesPorMes.get(key) ?? []
    return computeMonthSlice({
      ym,
      ingresosFijos: state.ingresosFijos,
      gastosFijos: state.gastosFijos,
      comprasMsi: state.comprasMsi,
      reservaAporteMes: state.aportesReserva.get(key) ?? 0,
      variablesDelMes: totalPorTipo(transacciones, 'variable'),
      reservaSaldoEntrante: state.reservaSaldoInicial,
      imprevistosDelMes: totalPorTipo(transacciones, 'imprevisto'),
      colchonEntrante: state.colchonInicial,
      usarValorAlto: false,
    })
  }

  return state.proyeccionBase.find((m) => monthKey(m.ym) === key) ?? null
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  cargando: true,
  mesVisible: mesActual(),
  ingresosFijos: [],
  gastosFijos: [],
  comprasMsi: [],
  escenario: [],
  escenarioActivo: true,
  transaccionesPorMes: new Map(),
  aportesReserva: new Map(),
  proyeccionBase: [],
  proyeccionEscenario: [],
  historialPorMes: new Map(),
  colchonInicial: 0,
  reservaSaldoInicial: 0,
  sliceVisible: null,
  extrasVisible: 0,
  transaccionesVisibles: [],

  cargar: async (db) => {
    const hoy = mesActual()
    const desdeVentana = addMonths(hoy, -VENTANA_ATRAS)
    const totalMeses = VENTANA_ATRAS + VENTANA_ADELANTE

    const [ingresosFijos, gastosFijos, comprasMsi, escenario, transacciones, aportesReserva, estadoAncla] =
      await Promise.all([
        getIngresosFijos(db),
        getGastosFijos(db),
        getComprasMsiActivas(db),
        getEscenarioItems(db),
        getTransaccionesEnRango(db, desdeVentana, totalMeses),
        getReservaAportesEnRango(db, desdeVentana, totalMeses),
        getEstadoMensual(db, addMonths(hoy, -1)),
      ])

    const transaccionesPorMes = agruparPorMes(transacciones)

    // Reconstruye el histórico de meses pasados dentro de la ventana a partir de lo que
    // ya quedó cerrado en estado_mensual (mismo criterio que db/cierre.ts: usarValorAlto true).
    const historialPorMes = new Map<string, MonthSlice>()
    let cursor = desdeVentana
    while (absoluteMonthIndex(cursor) < absoluteMonthIndex(hoy)) {
      const estadoPrevio = await getEstadoMensual(db, addMonths(cursor, -1))
      const transaccionesMes = transaccionesPorMes.get(monthKey(cursor)) ?? []
      const slice = computeMonthSlice({
        ym: cursor,
        ingresosFijos,
        gastosFijos,
        comprasMsi,
        reservaAporteMes: aportesReserva.get(monthKey(cursor)) ?? 0,
        variablesDelMes: totalPorTipo(transaccionesMes, 'variable'),
        reservaSaldoEntrante: estadoPrevio?.reservaSaldo ?? 0,
        imprevistosDelMes: totalPorTipo(transaccionesMes, 'imprevisto'),
        colchonEntrante: estadoPrevio?.colchonAcumulado ?? 0,
        usarValorAlto: true,
      })
      historialPorMes.set(monthKey(cursor), slice)
      cursor = addMonths(cursor, 1)
    }

    const colchonInicial = estadoAncla?.colchonAcumulado ?? 0
    const reservaSaldoInicial = estadoAncla?.reservaSaldo ?? 0

    const variablesPorMes = (ym: YearMonth) =>
      totalPorTipo(transaccionesPorMes.get(monthKey(ym)) ?? [], 'variable')
    const imprevistosPorMes = (ym: YearMonth) =>
      totalPorTipo(transaccionesPorMes.get(monthKey(ym)) ?? [], 'imprevisto')
    // Del mes en curso ya se conocen los gastos reales; de los futuros no, así que van conservadores.
    // Sin esto, el primer mes de la proyección no cuadra con el que Inicio muestra en grande.
    const usarValorAltoPorMes = (ym: YearMonth) => monthKey(ym) !== monthKey(hoy)

    const proyeccionBase = projectMonths({
      desde: hoy,
      meses: VENTANA_ADELANTE,
      colchonInicial,
      reservaSaldoInicial,
      ingresosFijos,
      gastosFijos,
      comprasMsi,
      reservaAportePorMes: (m) => aportesReserva.get(monthKey(m)) ?? 0,
      variablesPorMes,
      imprevistosPorMes,
      usarValorAltoPorMes,
    })

    const activos = escenario.filter((i) => i.activo)
    const proyeccionEscenario = projectMonths({
      desde: hoy,
      meses: VENTANA_ADELANTE,
      colchonInicial,
      reservaSaldoInicial,
      ingresosFijos,
      gastosFijos,
      comprasMsi,
      reservaAportePorMes: (m) => aportesReserva.get(monthKey(m)) ?? 0,
      variablesPorMes,
      imprevistosPorMes,
      usarValorAltoPorMes,
      extrasPorMes: (m) => impactoTotalEnMes(activos, m),
    })

    set({
      ingresosFijos,
      gastosFijos,
      comprasMsi,
      escenario,
      transaccionesPorMes,
      aportesReserva,
      proyeccionBase,
      proyeccionEscenario,
      historialPorMes,
      colchonInicial,
      reservaSaldoInicial,
      cargando: false,
    })

    const s = get()
    const key = monthKey(s.mesVisible)
    set({
      sliceVisible: calcularSliceVisible(s),
      extrasVisible: s.proyeccionEscenario.find((m) => monthKey(m.ym) === key)?.extras ?? 0,
      transaccionesVisibles: s.transaccionesPorMes.get(key) ?? [],
    })
  },

  irAMes: (ym) => {
    const hoy = mesActual()
    const idx = absoluteMonthIndex(ym)
    const min = absoluteMonthIndex(addMonths(hoy, -VENTANA_ATRAS))
    const max = absoluteMonthIndex(addMonths(hoy, VENTANA_ADELANTE - 1))
    if (idx < min || idx > max) return

    set({ mesVisible: ym })
    const s = get()
    const key = monthKey(ym)
    set({
      sliceVisible: calcularSliceVisible(s),
      extrasVisible: s.proyeccionEscenario.find((m) => monthKey(m.ym) === key)?.extras ?? 0,
      transaccionesVisibles: s.transaccionesPorMes.get(key) ?? [],
    })
  },

  mesAnterior: () => get().irAMes(addMonths(get().mesVisible, -1)),
  mesSiguiente: () => get().irAMes(addMonths(get().mesVisible, 1)),
  volverAHoy: () => get().irAMes(mesActual()),

  setEscenarioActivo: (activo) => {
    set({ escenarioActivo: activo })
    // El toggle global no cambia los datos persistidos; solo qué tan visible es su efecto.
    // Los números de proyeccionEscenario ya están calculados; el consumidor decide si los usa.
  },

  registrarGasto: async (db, gasto) => {
    await insertTransaccion(db, gasto)
    await get().cargar(db)
  },

  editarGasto: async (db, id, gasto) => {
    await updateTransaccion(db, id, gasto)
    await get().cargar(db)
  },

  eliminarGasto: async (db, id) => {
    await deleteTransaccion(db, id)
    await get().cargar(db)
  },

  agregarItemEscenario: async (db, item) => {
    await insertEscenarioItem(db, { ...item, activo: true })
    await get().cargar(db)
  },

  toggleItemEscenario: async (db, id, activo) => {
    await toggleEscenarioItem(db, id, activo)
    await get().cargar(db)
  },

  eliminarItemEscenario: async (db, id) => {
    await deleteEscenarioItem(db, id)
    await get().cargar(db)
  },

  limpiarEscenarioAction: async (db) => {
    await limpiarEscenario(db)
    await get().cargar(db)
  },

  hacerRealItem: async (db, id) => {
    const item = get().escenario.find((i) => i.id === id)
    if (!item) return

    if (item.tipo === 'meses') {
      await insertCompraMsi(db, {
        descripcion: item.descripcion,
        montoTotal: item.monto,
        numMeses: item.numMeses,
        mensualidad: calcularMensualidad(item.monto, item.numMeses),
        fechaInicio: item.inicio,
        activa: true,
      })
    } else if (item.tipo === 'recurrente') {
      await insertGastoFijo(db, {
        nombre: item.descripcion,
        montoMin: item.monto,
        montoMax: item.monto,
        frecuencia: 'mensual',
        diaDelMes: null,
        diaSemana: null,
        cadaNMeses: null,
        mesAncla: null,
        inicio: item.inicio,
        fin: item.numMeses > 1 ? addMonths(item.inicio, item.numMeses - 1) : null,
      })
    } else {
      const fecha = `${item.inicio.anio}-${String(item.inicio.mes).padStart(2, '0')}-01`
      await insertTransaccion(db, {
        fecha,
        monto: item.monto,
        descripcion: item.descripcion,
        tipo: 'variable',
      })
    }

    await deleteEscenarioItem(db, id)
    await get().cargar(db)
  },
}))
