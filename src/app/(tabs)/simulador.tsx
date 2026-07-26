import { useSQLiteContext } from 'expo-sqlite'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ProjectionStrip } from '@/components/ProjectionStrip'
import { formatMXN } from '@/lib/format'
import { useFinanceStore } from '@/store/useFinanceStore'

const PLAZOS = [1, 3, 6, 12]

export default function SimuladorScreen() {
  const db = useSQLiteContext()
  const insets = useSafeAreaInsets()
  const { cargando, cargar, simularCompra } = useFinanceStore()

  const [precio, setPrecio] = useState('')
  const [plazo, setPlazo] = useState(3)

  useEffect(() => {
    cargar(db)
  }, [db, cargar])

  const precioNumero = Number(precio.replace(',', '.')) || 0

  const resultado = useMemo(() => {
    if (cargando || precioNumero <= 0) return null
    return simularCompra(precioNumero, plazo)
  }, [cargando, precioNumero, plazo, simularCompra])

  const hayRiesgo = resultado?.proyeccion.some((m) => m.enRojo) ?? false

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-zinc-900"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32, paddingHorizontal: 24, gap: 24 }}
    >
      <View className="gap-2">
        <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">¿Me lo puedo comprar?</Text>
        <TextInput
          autoFocus
          value={precio}
          onChangeText={setPrecio}
          placeholder="$0"
          placeholderTextColor="#A1A1AA"
          keyboardType="decimal-pad"
          className="text-center text-5xl font-bold text-zinc-900 dark:text-zinc-100"
        />
      </View>

      <View className="flex-row gap-2">
        {PLAZOS.map((p) => (
          <Pressable
            key={p}
            onPress={() => setPlazo(p)}
            className={`flex-1 items-center rounded-xl py-3 ${plazo === p ? 'bg-green-600' : 'bg-zinc-100 dark:bg-zinc-800'}`}
          >
            <Text className={plazo === p ? 'font-semibold text-white' : 'text-zinc-700 dark:text-zinc-300'}>
              {p === 1 ? '1 mes' : `${p} MSI`}
            </Text>
          </Pressable>
        ))}
      </View>

      {resultado && (
        <>
          <View className="items-center gap-1 rounded-2xl bg-zinc-100 py-6 dark:bg-zinc-800">
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">Mensualidad</Text>
            <Text className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatMXN(resultado.mensualidad)}
            </Text>
          </View>

          {hayRiesgo && (
            <View className="rounded-xl bg-red-100 p-4 dark:bg-red-950">
              <Text className="font-semibold text-red-700 dark:text-red-300">
                ⚠ Esta compra deja al menos un mes en rojo en los próximos 6 meses.
              </Text>
            </View>
          )}

          <ProjectionStrip meses={resultado.proyeccion} />
        </>
      )}
    </ScrollView>
  )
}
