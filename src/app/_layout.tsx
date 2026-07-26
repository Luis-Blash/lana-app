import '@/global.css'

import { Stack } from 'expo-router'
import { SQLiteProvider } from 'expo-sqlite'
import type { SQLiteDatabase } from 'expo-sqlite'

import { cerrarMesesPendientes } from '@/db/cierre'
import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/schema'
import { loadSeedIfEmpty } from '@/seed/loadSeed'

async function initDatabase(db: SQLiteDatabase) {
  await migrateDbIfNeeded(db)
  await loadSeedIfEmpty(db)
  await cerrarMesesPendientes(db)
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="registrar"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Registrar gasto',
          }}
        />
      </Stack>
    </SQLiteProvider>
  )
}
