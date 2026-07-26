import { Pressable, Text, View } from 'react-native'

import { Transaccion } from '@/domain/types'
import { formatMXN } from '@/lib/format'

export function MovimientosMes({
  transacciones,
  onEditar,
  onEliminar,
}: {
  transacciones: Transaccion[]
  onEditar: (id: number) => void
  onEliminar: (id: number) => void
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Movimientos de este mes</Text>

      {transacciones.length === 0 ? (
        <Text className="text-xs text-zinc-500 dark:text-zinc-400">Aún no registras gastos este mes.</Text>
      ) : (
        transacciones.map((t) => <Movimiento key={t.id} t={t} onEditar={onEditar} onEliminar={onEliminar} />)
      )}

      <Text className="text-xs leading-4 text-zinc-500 dark:text-zinc-400">
        Toca un movimiento para editarlo. Los imprevistos salen de tu reserva; los verás en Apartados.
      </Text>
    </View>
  )
}

function Movimiento({
  t,
  onEditar,
  onEliminar,
}: {
  t: Transaccion
  onEditar: (id: number) => void
  onEliminar: (id: number) => void
}) {
  const esImprevisto = t.tipo === 'imprevisto'
  return (
    <Pressable
      onPress={() => onEditar(t.id)}
      className="flex-row items-center justify-between rounded-lg bg-zinc-100 px-4 py-3 active:bg-zinc-200 dark:bg-zinc-800 dark:active:bg-zinc-700"
    >
      <View className="flex-1 pr-2">
        <Text className="font-medium text-zinc-900 dark:text-zinc-100">
          {t.descripcion || (esImprevisto ? 'Imprevisto' : 'Gasto')}
        </Text>
        <View className="flex-row items-center gap-2">
          <View className={`rounded px-1.5 py-0.5 ${esImprevisto ? 'bg-amber-200 dark:bg-amber-900' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
            <Text className={`text-[10px] font-medium ${esImprevisto ? 'text-amber-800 dark:text-amber-200' : 'text-zinc-600 dark:text-zinc-300'}`}>
              {esImprevisto ? 'Imprevisto' : 'Día a día'}
            </Text>
          </View>
          <Text className="text-xs text-zinc-400 dark:text-zinc-500">{t.fecha.slice(8, 10)}/{t.fecha.slice(5, 7)}</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-3">
        <Text className="tabular-nums text-zinc-700 dark:text-zinc-300">−{formatMXN(t.monto)}</Text>
        <Pressable onPress={() => onEliminar(t.id)} hitSlop={8}>
          <Text className="text-red-500">Eliminar</Text>
        </Pressable>
      </View>
    </Pressable>
  )
}
