import { Pressable, ScrollView, Text, View } from 'react-native'

import { monthKey } from '@/domain/month'
import { ProjectedMonth, YearMonth } from '@/domain/types'
import { formatMesCorto, formatMontoCorto } from '@/lib/format'

export function ProjectionStrip({
  meses,
  mesesEscenario,
  mesVisible,
  onSeleccionar,
}: {
  meses: ProjectedMonth[]
  mesesEscenario?: ProjectedMonth[]
  mesVisible?: YearMonth
  onSeleccionar?: (ym: YearMonth) => void
}) {
  const escenarioPorMes = new Map((mesesEscenario ?? []).map((m) => [monthKey(m.ym), m]))
  const visibleKey = mesVisible ? monthKey(mesVisible) : null

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Próximos {meses.length} meses</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {meses.map((m) => {
          const key = monthKey(m.ym)
          const conEscenario = escenarioPorMes.get(key)
          const seleccionado = key === visibleKey
          const enRojo = conEscenario ? conEscenario.enRojo : m.enRojo

          return (
            <Pressable
              key={key}
              onPress={() => onSeleccionar?.(m.ym)}
              className={`w-24 items-center gap-1 rounded-xl p-3 ${
                enRojo ? 'bg-red-100 dark:bg-red-950' : 'bg-green-100 dark:bg-green-950'
              } ${seleccionado ? 'border-2 border-zinc-900 dark:border-white' : 'border-2 border-transparent'}`}
            >
              <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{formatMesCorto(m.ym)}</Text>
              <Text
                className={`text-sm font-semibold tabular-nums ${
                  enRojo ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'
                }`}
              >
                {formatMontoCorto(conEscenario ? conEscenario.disponible : m.disponible)}
              </Text>
              {conEscenario && conEscenario.disponible !== m.disponible && (
                <Text className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  sin esc. {formatMontoCorto(m.disponible)}
                </Text>
              )}
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}
