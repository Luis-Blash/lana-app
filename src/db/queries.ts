import type { SQLiteDatabase } from 'expo-sqlite'

import { addMonths, monthKey } from '@/domain/month'
import {
  CompraMsi,
  EscenarioItem,
  GastoFijo,
  IngresoFijo,
  TipoEscenario,
  TipoTransaccion,
  Transaccion,
  YearMonth,
} from '@/domain/types'

type IngresoFijoRow = { id: number; nombre: string; monto: number; dia_del_mes: number }
type GastoFijoRow = {
  id: number
  nombre: string
  monto_min: number
  monto_max: number
  frecuencia: GastoFijo['frecuencia']
  dia_del_mes: number | null
  dia_semana: number | null
  cada_n_meses: number | null
  mes_ancla: number | null
  anio_inicio: number | null
  mes_inicio: number | null
  anio_fin: number | null
  mes_fin: number | null
}
type CompraMsiRow = {
  id: number
  descripcion: string
  monto_total: number
  num_meses: number
  mensualidad: number
  anio_inicio: number
  mes_inicio: number
  activa: number
}
type TransaccionRow = { id: number; fecha: string; monto: number; descripcion: string; tipo: TipoTransaccion }
type EscenarioItemRow = {
  id: number
  tipo: TipoEscenario
  descripcion: string
  monto: number
  num_meses: number
  anio_inicio: number
  mes_inicio: number
  activo: number
}

const toIngresoFijo = (r: IngresoFijoRow): IngresoFijo => ({
  id: r.id,
  nombre: r.nombre,
  monto: r.monto,
  diaDelMes: r.dia_del_mes,
})

const toGastoFijo = (r: GastoFijoRow): GastoFijo => ({
  id: r.id,
  nombre: r.nombre,
  montoMin: r.monto_min,
  montoMax: r.monto_max,
  frecuencia: r.frecuencia,
  diaDelMes: r.dia_del_mes,
  diaSemana: r.dia_semana,
  cadaNMeses: r.cada_n_meses,
  mesAncla: r.mes_ancla,
  inicio: r.anio_inicio != null && r.mes_inicio != null ? { anio: r.anio_inicio, mes: r.mes_inicio } : null,
  fin: r.anio_fin != null && r.mes_fin != null ? { anio: r.anio_fin, mes: r.mes_fin } : null,
})

const toCompraMsi = (r: CompraMsiRow): CompraMsi => ({
  id: r.id,
  descripcion: r.descripcion,
  montoTotal: r.monto_total,
  numMeses: r.num_meses,
  mensualidad: r.mensualidad,
  fechaInicio: { anio: r.anio_inicio, mes: r.mes_inicio },
  activa: r.activa === 1,
})

const toTransaccion = (r: TransaccionRow): Transaccion => ({
  id: r.id,
  fecha: r.fecha,
  monto: r.monto,
  descripcion: r.descripcion,
  tipo: r.tipo,
})

const toEscenarioItem = (r: EscenarioItemRow): EscenarioItem => ({
  id: r.id,
  tipo: r.tipo,
  descripcion: r.descripcion,
  monto: r.monto,
  numMeses: r.num_meses,
  inicio: { anio: r.anio_inicio, mes: r.mes_inicio },
  activo: r.activo === 1,
})

export async function getIngresosFijos(db: SQLiteDatabase): Promise<IngresoFijo[]> {
  const rows = await db.getAllAsync<IngresoFijoRow>('SELECT * FROM ingresos_fijos ORDER BY dia_del_mes')
  return rows.map(toIngresoFijo)
}

export async function insertIngresoFijo(
  db: SQLiteDatabase,
  ingreso: Omit<IngresoFijo, 'id'>,
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO ingresos_fijos (nombre, monto, dia_del_mes) VALUES (?, ?, ?)',
    ingreso.nombre,
    ingreso.monto,
    ingreso.diaDelMes,
  )
  return result.lastInsertRowId
}

export async function updateIngresoFijo(
  db: SQLiteDatabase,
  id: number,
  ingreso: Omit<IngresoFijo, 'id'>,
): Promise<void> {
  await db.runAsync(
    'UPDATE ingresos_fijos SET nombre = ?, monto = ?, dia_del_mes = ? WHERE id = ?',
    ingreso.nombre,
    ingreso.monto,
    ingreso.diaDelMes,
    id,
  )
}

export async function deleteIngresoFijo(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM ingresos_fijos WHERE id = ?', id)
}

export async function getGastosFijos(db: SQLiteDatabase): Promise<GastoFijo[]> {
  const rows = await db.getAllAsync<GastoFijoRow>('SELECT * FROM gastos_fijos ORDER BY nombre')
  return rows.map(toGastoFijo)
}

export async function insertGastoFijo(db: SQLiteDatabase, gasto: Omit<GastoFijo, 'id'>): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO gastos_fijos
      (nombre, monto_min, monto_max, frecuencia, dia_del_mes, dia_semana, cada_n_meses, mes_ancla,
       anio_inicio, mes_inicio, anio_fin, mes_fin)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    gasto.nombre,
    gasto.montoMin,
    gasto.montoMax,
    gasto.frecuencia,
    gasto.diaDelMes,
    gasto.diaSemana,
    gasto.cadaNMeses,
    gasto.mesAncla,
    gasto.inicio?.anio ?? null,
    gasto.inicio?.mes ?? null,
    gasto.fin?.anio ?? null,
    gasto.fin?.mes ?? null,
  )
  return result.lastInsertRowId
}

export async function updateGastoFijo(
  db: SQLiteDatabase,
  id: number,
  gasto: Omit<GastoFijo, 'id'>,
): Promise<void> {
  await db.runAsync(
    `UPDATE gastos_fijos SET
      nombre = ?, monto_min = ?, monto_max = ?, frecuencia = ?,
      dia_del_mes = ?, dia_semana = ?, cada_n_meses = ?, mes_ancla = ?,
      anio_inicio = ?, mes_inicio = ?, anio_fin = ?, mes_fin = ?
     WHERE id = ?`,
    gasto.nombre,
    gasto.montoMin,
    gasto.montoMax,
    gasto.frecuencia,
    gasto.diaDelMes,
    gasto.diaSemana,
    gasto.cadaNMeses,
    gasto.mesAncla,
    gasto.inicio?.anio ?? null,
    gasto.inicio?.mes ?? null,
    gasto.fin?.anio ?? null,
    gasto.fin?.mes ?? null,
    id,
  )
}

export async function deleteGastoFijo(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM gastos_fijos WHERE id = ?', id)
}

export async function getComprasMsi(db: SQLiteDatabase): Promise<CompraMsi[]> {
  const rows = await db.getAllAsync<CompraMsiRow>(
    'SELECT * FROM compras_msi ORDER BY anio_inicio DESC, mes_inicio DESC',
  )
  return rows.map(toCompraMsi)
}

export async function getComprasMsiActivas(db: SQLiteDatabase): Promise<CompraMsi[]> {
  const rows = await db.getAllAsync<CompraMsiRow>('SELECT * FROM compras_msi WHERE activa = 1')
  return rows.map(toCompraMsi)
}

export async function insertCompraMsi(db: SQLiteDatabase, compra: Omit<CompraMsi, 'id'>): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO compras_msi
      (descripcion, monto_total, num_meses, mensualidad, anio_inicio, mes_inicio, activa)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    compra.descripcion,
    compra.montoTotal,
    compra.numMeses,
    compra.mensualidad,
    compra.fechaInicio.anio,
    compra.fechaInicio.mes,
    compra.activa ? 1 : 0,
  )
  return result.lastInsertRowId
}

export async function updateCompraMsi(
  db: SQLiteDatabase,
  id: number,
  compra: Omit<CompraMsi, 'id'>,
): Promise<void> {
  await db.runAsync(
    `UPDATE compras_msi SET
      descripcion = ?, monto_total = ?, num_meses = ?, mensualidad = ?,
      anio_inicio = ?, mes_inicio = ?, activa = ?
     WHERE id = ?`,
    compra.descripcion,
    compra.montoTotal,
    compra.numMeses,
    compra.mensualidad,
    compra.fechaInicio.anio,
    compra.fechaInicio.mes,
    compra.activa ? 1 : 0,
    id,
  )
}

export async function desactivarCompraMsi(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('UPDATE compras_msi SET activa = 0 WHERE id = ?', id)
}

export async function deleteCompraMsi(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM compras_msi WHERE id = ?', id)
}

export async function getTransaccionesDelMes(db: SQLiteDatabase, ym: YearMonth): Promise<Transaccion[]> {
  const prefix = `${ym.anio}-${String(ym.mes).padStart(2, '0')}`
  const rows = await db.getAllAsync<TransaccionRow>(
    "SELECT * FROM transacciones WHERE fecha LIKE ? || '%' ORDER BY fecha DESC",
    prefix,
  )
  return rows.map(toTransaccion)
}

/** Todas las transacciones en `meses` meses consecutivos a partir de `desde` (incluido). */
export async function getTransaccionesEnRango(
  db: SQLiteDatabase,
  desde: YearMonth,
  meses: number,
): Promise<Transaccion[]> {
  const hasta = addMonths(desde, meses)
  const desdeStr = `${desde.anio}-${String(desde.mes).padStart(2, '0')}-01`
  const hastaStr = `${hasta.anio}-${String(hasta.mes).padStart(2, '0')}-01`
  const rows = await db.getAllAsync<TransaccionRow>(
    'SELECT * FROM transacciones WHERE fecha >= ? AND fecha < ? ORDER BY fecha DESC',
    desdeStr,
    hastaStr,
  )
  return rows.map(toTransaccion)
}

export async function insertTransaccion(db: SQLiteDatabase, t: Omit<Transaccion, 'id'>): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO transacciones (fecha, monto, descripcion, tipo) VALUES (?, ?, ?, ?)',
    t.fecha,
    t.monto,
    t.descripcion,
    t.tipo,
  )
  return result.lastInsertRowId
}

export async function updateTransaccion(
  db: SQLiteDatabase,
  id: number,
  t: { fecha: string; monto: number; descripcion: string; tipo: TipoTransaccion },
): Promise<void> {
  await db.runAsync(
    'UPDATE transacciones SET fecha = ?, monto = ?, descripcion = ?, tipo = ? WHERE id = ?',
    t.fecha,
    t.monto,
    t.descripcion,
    t.tipo,
    id,
  )
}

export async function getTransaccion(db: SQLiteDatabase, id: number): Promise<Transaccion | null> {
  const row = await db.getFirstAsync<TransaccionRow>('SELECT * FROM transacciones WHERE id = ?', id)
  return row ? toTransaccion(row) : null
}

export async function deleteTransaccion(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM transacciones WHERE id = ?', id)
}

export async function getReservaMontoDefault(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ monto_default: number }>(
    'SELECT monto_default FROM reserva_config WHERE id = 1',
  )
  return row?.monto_default ?? 0
}

export async function setReservaMontoDefault(db: SQLiteDatabase, monto: number): Promise<void> {
  await db.runAsync(
    'INSERT INTO reserva_config (id, monto_default) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET monto_default = ?',
    monto,
    monto,
  )
}

export async function getReservaAporteMes(db: SQLiteDatabase, ym: YearMonth): Promise<number> {
  const override = await db.getFirstAsync<{ monto: number }>(
    'SELECT monto FROM reserva_override WHERE anio = ? AND mes = ?',
    ym.anio,
    ym.mes,
  )
  if (override) return override.monto
  return getReservaMontoDefault(db)
}

/** Aporte de reserva para cada uno de los próximos `meses` meses, respetando overrides por mes. */
export async function getReservaAportesEnRango(
  db: SQLiteDatabase,
  desde: YearMonth,
  meses: number,
): Promise<Map<string, number>> {
  const montoDefault = await getReservaMontoDefault(db)
  const overrides = await db.getAllAsync<{ anio: number; mes: number; monto: number }>(
    'SELECT anio, mes, monto FROM reserva_override',
  )
  const overrideMap = new Map(overrides.map((o) => [monthKey({ anio: o.anio, mes: o.mes }), o.monto]))

  const result = new Map<string, number>()
  let ym = desde
  for (let i = 0; i < meses; i++) {
    const key = monthKey(ym)
    result.set(key, overrideMap.get(key) ?? montoDefault)
    ym = addMonths(ym, 1)
  }
  return result
}

export async function setReservaOverrideMes(db: SQLiteDatabase, ym: YearMonth, monto: number): Promise<void> {
  await db.runAsync(
    `INSERT INTO reserva_override (anio, mes, monto) VALUES (?, ?, ?)
     ON CONFLICT(anio, mes) DO UPDATE SET monto = ?`,
    ym.anio,
    ym.mes,
    monto,
    monto,
  )
}

export async function getEstadoMensual(
  db: SQLiteDatabase,
  ym: YearMonth,
): Promise<{ colchonAcumulado: number; reservaSaldo: number } | null> {
  const row = await db.getFirstAsync<{ colchon_acumulado: number; reserva_saldo: number }>(
    'SELECT colchon_acumulado, reserva_saldo FROM estado_mensual WHERE anio = ? AND mes = ?',
    ym.anio,
    ym.mes,
  )
  if (!row) return null
  return { colchonAcumulado: row.colchon_acumulado, reservaSaldo: row.reserva_saldo }
}

export async function cerrarMes(
  db: SQLiteDatabase,
  ym: YearMonth,
  colchonAcumulado: number,
  reservaSaldo: number,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO estado_mensual (anio, mes, colchon_acumulado, reserva_saldo, cerrado) VALUES (?, ?, ?, ?, 1)
     ON CONFLICT(anio, mes) DO UPDATE SET colchon_acumulado = ?, reserva_saldo = ?, cerrado = 1`,
    ym.anio,
    ym.mes,
    colchonAcumulado,
    reservaSaldo,
    colchonAcumulado,
    reservaSaldo,
  )
}

/**
 * Guarda los saldos con los que el usuario arranca (el "ancla"): el colchón y la
 * reserva que ya tiene hoy. Se guardan en el mes ancla (normalmente el mes anterior),
 * que es de donde el mes actual toma sus saldos entrantes.
 */
export async function setSaldosIniciales(
  db: SQLiteDatabase,
  ymAncla: YearMonth,
  colchon: number,
  reservaSaldo: number,
): Promise<void> {
  await cerrarMes(db, ymAncla, colchon, reservaSaldo)
}

/**
 * Borra todo el historial acumulado (colchón, reserva y ajustes por mes) y deja el
 * mes ancla en cero. No toca ingresos, gastos fijos ni transacciones registradas.
 */
export async function resetHistorial(db: SQLiteDatabase, ymAncla: YearMonth): Promise<void> {
  await db.execAsync('DELETE FROM estado_mensual; DELETE FROM reserva_override; DELETE FROM escenario_items;')
  await cerrarMes(db, ymAncla, 0, 0)
}

export async function getEscenarioItems(db: SQLiteDatabase): Promise<EscenarioItem[]> {
  const rows = await db.getAllAsync<EscenarioItemRow>(
    'SELECT * FROM escenario_items ORDER BY anio_inicio, mes_inicio',
  )
  return rows.map(toEscenarioItem)
}

export async function insertEscenarioItem(
  db: SQLiteDatabase,
  item: Omit<EscenarioItem, 'id'>,
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO escenario_items (tipo, descripcion, monto, num_meses, anio_inicio, mes_inicio, activo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    item.tipo,
    item.descripcion,
    item.monto,
    item.numMeses,
    item.inicio.anio,
    item.inicio.mes,
    item.activo ? 1 : 0,
  )
  return result.lastInsertRowId
}

export async function updateEscenarioItem(
  db: SQLiteDatabase,
  id: number,
  item: Omit<EscenarioItem, 'id'>,
): Promise<void> {
  await db.runAsync(
    `UPDATE escenario_items SET
      tipo = ?, descripcion = ?, monto = ?, num_meses = ?, anio_inicio = ?, mes_inicio = ?, activo = ?
     WHERE id = ?`,
    item.tipo,
    item.descripcion,
    item.monto,
    item.numMeses,
    item.inicio.anio,
    item.inicio.mes,
    item.activo ? 1 : 0,
    id,
  )
}

export async function toggleEscenarioItem(db: SQLiteDatabase, id: number, activo: boolean): Promise<void> {
  await db.runAsync('UPDATE escenario_items SET activo = ? WHERE id = ?', activo ? 1 : 0, id)
}

export async function deleteEscenarioItem(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM escenario_items WHERE id = ?', id)
}

export async function limpiarEscenario(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM escenario_items')
}
