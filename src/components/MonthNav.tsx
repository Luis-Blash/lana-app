import { Ionicons } from '@expo/vector-icons'
import { Pressable, Text, View } from 'react-native'

import { YearMonth } from '@/domain/types'
import { formatMesLargo } from '@/lib/format'

export function MonthNav({
  ym,
  esHoy,
  onAnterior,
  onSiguiente,
  onHoy,
}: {
  ym: YearMonth
  esHoy: boolean
  onAnterior: () => void
  onSiguiente: () => void
  onHoy: () => void
}) {
  return (
    <View className="flex-row items-center justify-center gap-4">
      <Pressable onPress={onAnterior} hitSlop={12} className="p-1">
        <Ionicons name="chevron-back" size={22} className="text-zinc-500 dark:text-zinc-400" color="#71717a" />
      </Pressable>

      <View className="items-center">
        <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{formatMesLargo(ym)}</Text>
        {!esHoy && (
          <Pressable onPress={onHoy} hitSlop={8}>
            <Text className="text-xs font-medium text-green-600 dark:text-green-400">Hoy</Text>
          </Pressable>
        )}
      </View>

      <Pressable onPress={onSiguiente} hitSlop={12} className="p-1">
        <Ionicons
          name="chevron-forward"
          size={22}
          className="text-zinc-500 dark:text-zinc-400"
          color="#71717a"
        />
      </Pressable>
    </View>
  )
}
