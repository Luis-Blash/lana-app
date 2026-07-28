import type { SQLiteDatabase } from 'expo-sqlite'

import { addMonths } from '@/domain/month'
import { mesActual } from '@/lib/fechas'

import { cerrarMes, getEstadoMensual } from './queries'

/**
 * Ancla el mes anterior en cero si todavía no existe ningún estado mensual.
 * Sin esto, cerrarMesesPendientes no tiene de dónde partir en una instalación nueva.
 * La app arranca siempre sin ingresos, gastos ni saldos: el usuario los captura él mismo.
 */
export async function asegurarAnclaGenesis(db: SQLiteDatabase): Promise<void> {
  const ancla = addMonths(mesActual(), -1)
  if (await getEstadoMensual(db, ancla)) return
  await cerrarMes(db, ancla, 0, 0)
}
