import { ScrollView, Text, View } from 'react-native'

import { ProjectedMonth } from '@/domain/types'
import { formatMesCorto, formatMontoCorto } from '@/lib/format'

export function ProjectionStrip({ meses }: { meses: ProjectedMonth[] }) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Próximos {meses.length} meses</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {meses.map((m) => (
          <View
            key={`${m.ym.anio}-${m.ym.mes}`}
            className={`w-24 items-center gap-1 rounded-xl p-3 ${
              m.enRojo ? 'bg-red-100 dark:bg-red-950' : 'bg-green-100 dark:bg-green-950'
            }`}
          >
            <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{formatMesCorto(m.ym)}</Text>
            <Text
              className={`text-sm font-semibold tabular-nums ${
                m.enRojo ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'
              }`}
            >
              {formatMontoCorto(m.disponible)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
