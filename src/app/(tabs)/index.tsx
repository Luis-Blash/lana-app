import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useEffect } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { HeroDisponible } from '@/components/HeroDisponible'
import { ProjectionStrip } from '@/components/ProjectionStrip'
import { formatMXN } from '@/lib/format'
import { useFinanceStore } from '@/store/useFinanceStore'

export default function InicioScreen() {
  const db = useSQLiteContext()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { cargando, slice, proyeccion, cargar } = useFinanceStore()

  useEffect(() => {
    cargar(db)
  }, [db, cargar])

  if (cargando || !slice) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-900">
        <Text className="text-zinc-500 dark:text-zinc-400">Cargando…</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white dark:bg-zinc-900">
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96, paddingHorizontal: 24, gap: 24 }}
      >
        <HeroDisponible disponible={slice.disponible} enRojo={slice.enRojo} />

        <ProjectionStrip meses={proyeccion} />

        <View className="gap-2 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
          <Row label="Ingresos" valor={slice.ingresos} />
          <Row label="Gastos fijos" valor={-slice.gastosFijos} />
          <Row label="Mensualidades MSI" valor={-slice.msiTotal} />
          <Row label="Reserva imprevistos" valor={-slice.reservaAporte} />
          <Row label="Gastos variables" valor={-slice.variablesGastados} />
          <Row label="Colchón del mes anterior" valor={slice.colchonEntrante} />
        </View>
      </ScrollView>

      <Pressable
        onPress={() => router.push('/registrar')}
        style={{ bottom: insets.bottom + 16 }}
        className="absolute right-6 flex-row items-center gap-2 rounded-full bg-green-600 px-5 py-4 shadow-lg active:bg-green-700"
      >
        <Ionicons name="add" color="white" size={22} />
        <Text className="text-base font-semibold text-white">Gasto</Text>
      </Pressable>
    </View>
  )
}

function Row({ label, valor }: { label: string; valor: number }) {
  const color = valor < 0 ? 'text-red-500 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'
  return (
    <View className="flex-row justify-between">
      <Text className="text-zinc-600 dark:text-zinc-400">{label}</Text>
      <Text className={`tabular-nums ${color}`}>{formatMXN(valor)}</Text>
    </View>
  )
}
