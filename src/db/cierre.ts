import type { SQLiteDatabase } from 'expo-sqlite'

import { computeMonthSlice } from '@/domain/disponible'
import { addMonths } from '@/domain/month'
import { YearMonth } from '@/domain/types'

import {
  cerrarMes,
  getComprasMsiActivas,
  getEstadoMensual,
  getGastosFijos,
  getIngresosFijos,
  getReservaAporteMes,
  getTransaccionesDelMes,
} from './queries'

function mesActual(): YearMonth {
  const hoy = new Date()
  return { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 }
}

const LIMITE_MESES_ATRAS = 24

/**
 * Al abrir la app en un mes nuevo, cierra los meses ya terminados que van DESPUÉS
 * del último mes cerrado (el "ancla"): calcula su disponible final con las
 * transacciones reales y hace rodar colchón + reserva_saldo al mes siguiente.
 *
 * Si no existe ningún ancla previo (instalación nueva o base de datos vieja), NO
 * inventa historia hacia atrás: simplemente fija el mes anterior en cero como punto
 * de partida. Así se evita el bug de "meses fantasma" que inflaba la reserva.
 */
export async function cerrarMesesPendientes(db: SQLiteDatabase): Promise<void> {
  let cursor = addMonths(mesActual(), -1)
  const pendientes: YearMonth[] = []
  let anclaEncontrada = false

  for (let i = 0; i < LIMITE_MESES_ATRAS; i++) {
    const estado = await getEstadoMensual(db, cursor)
    if (estado) {
      anclaEncontrada = true
      break
    }
    pendientes.unshift(cursor)
    cursor = addMonths(cursor, -1)
  }

  if (!anclaEncontrada) {
    // No hay historia real: anclar el mes anterior en cero y salir sin inventar meses.
    await cerrarMes(db, addMonths(mesActual(), -1), 0, 0)
    return
  }

  const [ingresosFijos, gastosFijos, comprasMsi] = await Promise.all([
    getIngresosFijos(db),
    getGastosFijos(db),
    getComprasMsiActivas(db),
  ])

  for (const ym of pendientes) {
    const mesPrevio = addMonths(ym, -1)
    const estadoPrevio = await getEstadoMensual(db, mesPrevio)
    const colchonEntrante = estadoPrevio?.colchonAcumulado ?? 0
    const reservaSaldoEntrante = estadoPrevio?.reservaSaldo ?? 0

    const [reservaAporte, transacciones] = await Promise.all([
      getReservaAporteMes(db, ym),
      getTransaccionesDelMes(db, ym),
    ])
    const variablesDelMes = transacciones.filter((t) => t.tipo === 'variable').reduce((s, t) => s + t.monto, 0)
    const imprevistosDelMes = transacciones
      .filter((t) => t.tipo === 'imprevisto')
      .reduce((s, t) => s + t.monto, 0)

    const slice = computeMonthSlice({
      ym,
      ingresosFijos,
      gastosFijos,
      comprasMsi,
      reservaAporteMes: reservaAporte,
      variablesDelMes,
      colchonEntrante,
      usarValorAlto: true,
    })

    const reservaSaldoResultante = reservaSaldoEntrante + reservaAporte - imprevistosDelMes
    await cerrarMes(db, ym, slice.disponible, reservaSaldoResultante)
  }
}
