import type { SQLiteDatabase } from 'expo-sqlite'

export const DATABASE_NAME = 'lana.db'
const SCHEMA_VERSION = 1

const DDL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS ingresos_fijos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  monto REAL NOT NULL,
  dia_del_mes INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS gastos_fijos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  monto_min REAL NOT NULL,
  monto_max REAL NOT NULL,
  frecuencia TEXT NOT NULL CHECK (frecuencia IN ('mensual', 'semanal', 'cada_n_meses')),
  dia_del_mes INTEGER,
  dia_semana INTEGER,
  cada_n_meses INTEGER,
  mes_ancla INTEGER
);

CREATE TABLE IF NOT EXISTS transacciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  monto REAL NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL CHECK (tipo IN ('variable', 'imprevisto'))
);

CREATE TABLE IF NOT EXISTS compras_msi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  descripcion TEXT NOT NULL,
  monto_total REAL NOT NULL,
  num_meses INTEGER NOT NULL,
  mensualidad REAL NOT NULL,
  anio_inicio INTEGER NOT NULL,
  mes_inicio INTEGER NOT NULL,
  activa INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS reserva_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  monto_default REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reserva_override (
  anio INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  monto REAL NOT NULL,
  PRIMARY KEY (anio, mes)
);

CREATE TABLE IF NOT EXISTS estado_mensual (
  anio INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  colchon_acumulado REAL NOT NULL DEFAULT 0,
  reserva_saldo REAL NOT NULL DEFAULT 0,
  cerrado INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (anio, mes)
);
`

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
  const currentVersion = row?.user_version ?? 0
  if (currentVersion >= SCHEMA_VERSION) return

  await db.execAsync(DDL)
  await db.execAsync(
    `INSERT OR IGNORE INTO reserva_config (id, monto_default) VALUES (1, 0);`,
  )
  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`)
}
