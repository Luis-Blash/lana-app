import type { SQLiteDatabase } from 'expo-sqlite'

import { cerrarMes, getIngresosFijos, insertGastoFijo, insertIngresoFijo, setReservaMontoDefault } from '@/db/queries'
import { addMonths } from '@/domain/month'

import { seedGastosFijos, seedIngresosFijos, seedReservaMontoDefault } from './data'

function mesActual() {
  const hoy = new Date()
  return { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 }
}

export async function loadSeedIfEmpty(db: SQLiteDatabase): Promise<void> {
  const existentes = await getIngresosFijos(db)
  if (existentes.length > 0) return

  for (const ingreso of seedIngresosFijos) {
    await insertIngresoFijo(db, ingreso)
  }
  for (const gasto of seedGastosFijos) {
    await insertGastoFijo(db, gasto)
  }
  await setReservaMontoDefault(db, seedReservaMontoDefault)

  // Ancla de génesis: el mes anterior al primer uso arranca en cero, para que el
  // cierre automático de meses (db/cierre.ts) nunca "invente" historia previa a la app.
  await cerrarMes(db, addMonths(mesActual(), -1), 0, 0)
}
