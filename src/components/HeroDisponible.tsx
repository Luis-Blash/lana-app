import { Text, View } from 'react-native'

import { formatMXN } from '@/lib/format'

export function HeroDisponible({ disponible, enRojo }: { disponible: number; enRojo: boolean }) {
  const color = enRojo ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'

  return (
    <View className="items-center gap-1 pt-8">
      <Text className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Disponible real
      </Text>
      <Text className={`text-5xl font-bold tabular-nums ${color}`}>{formatMXN(disponible)}</Text>
    </View>
  )
}
