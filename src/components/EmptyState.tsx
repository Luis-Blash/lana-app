import { Text, View } from 'react-native'

import { BotonPrimario } from './ui'

export function EmptyState({
  titulo,
  texto,
  accion,
  onAccion,
}: {
  titulo: string
  texto: string
  accion?: string
  onAccion?: () => void
}) {
  return (
    <View className="items-center gap-2 rounded-2xl bg-zinc-100 p-6 dark:bg-zinc-800">
      <Text className="text-center text-base font-semibold text-zinc-900 dark:text-zinc-100">{titulo}</Text>
      <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">{texto}</Text>
      {accion && onAccion ? (
        <View className="mt-2 w-full">
          <BotonPrimario label={accion} onPress={onAccion} />
        </View>
      ) : null}
    </View>
  )
}
