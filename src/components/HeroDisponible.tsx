import { Text, View } from 'react-native'

import { formatMXN } from '@/lib/format'

export function HeroDisponible({
  disponible,
  enRojo,
  saldoDelMes,
  enRojoDelMes,
  colchonEntrante,
}: {
  disponible: number
  enRojo: boolean
  saldoDelMes: number
  enRojoDelMes: boolean
  colchonEntrante: number
}) {
  const colorReal = enRojo ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
  const colorMes = enRojoDelMes ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'

  return (
    <View className="gap-4 pt-6">
      <View className="items-center gap-1">
        <Text className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Disponible real
        </Text>
        <Text className={`text-5xl font-bold tabular-nums ${colorReal}`}>{formatMXN(disponible)}</Text>
        {colchonEntrante !== 0 && (
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
            incluye {formatMXN(colchonEntrante)} de lo que te sobró antes
          </Text>
        )}
      </View>

      <View className="flex-row items-center justify-between rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
        <View>
          <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Este mes solo</Text>
          <Text className="text-[11px] text-zinc-400 dark:text-zinc-500">{leyenda(enRojo, enRojoDelMes)}</Text>
        </View>
        <Text className={`text-lg font-semibold tabular-nums ${colorMes}`}>{formatMXN(saldoDelMes)}</Text>
      </View>
    </View>
  )
}

function leyenda(enRojoReal: boolean, enRojoMes: boolean): string {
  if (!enRojoMes) return 'Lo que entra este mes alcanza para todo'
  if (!enRojoReal) return 'Gastaste más de lo que entró; lo cubrió tu colchón'
  return 'Este mes no alcanza y tampoco tienes colchón para cubrirlo'
}
