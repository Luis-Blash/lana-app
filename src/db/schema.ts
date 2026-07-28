import type { SQLiteDatabase } from 'expo-sqlite'

export const DATABASE_NAME = 'lana.db'
const SCHEMA_VERSION = 2

const DDL_V1 = `
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

const DDL_V2 = `
ALTER TABLE gastos_fijos ADD COLUMN anio_inicio INTEGER;
ALTER TABLE gastos_fijos ADD COLUMN mes_inicio INTEGER;
ALTER TABLE gastos_fijos ADD COLUMN anio_fin INTEGER;
ALTER TABLE gastos_fijos ADD COLUMN mes_fin INTEGER;

CREATE TABLE IF NOT EXISTS escenario_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL CHECK (tipo IN ('unico','meses','recurrente')),
  descripcion TEXT NOT NULL DEFAULT '',
  monto REAL NOT NULL,
  num_meses INTEGER NOT NULL DEFAULT 1,
  anio_inicio INTEGER NOT NULL,
  mes_inicio INTEGER NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones (fecha);
`

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
  let currentVersion = row?.user_version ?? 0
  if (currentVersion >= SCHEMA_VERSION) return

  if (currentVersion < 1) {
    await db.execAsync(DDL_V1)
    await db.execAsync(`INSERT OR IGNORE INTO reserva_config (id, monto_default) VALUES (1, 0);`)
    currentVersion = 1
  }

  if (currentVersion < 2) {
    await db.execAsync(DDL_V2)
    currentVersion = 2
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`)
}
