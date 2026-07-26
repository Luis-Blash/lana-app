import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useEffect, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'

import { getTransaccion } from '@/db/queries'
import { TipoTransaccion } from '@/domain/types'
import { useFinanceStore } from '@/store/useFinanceStore'

export default function RegistrarScreen() {
  const db = useSQLiteContext()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const editandoId = id ? Number(id) : null

  const registrarGasto = useFinanceStore((s) => s.registrarGasto)
  const editarGasto = useFinanceStore((s) => s.editarGasto)

  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tipo, setTipo] = useState<TipoTransaccion>('variable')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (editandoId == null) return
    getTransaccion(db, editandoId).then((t) => {
      if (!t) return
      setMonto(String(t.monto))
      setDescripcion(t.descripcion)
      setTipo(t.tipo)
    })
  }, [db, editandoId])

  const montoNumero = Number(monto.replace(',', '.'))
  const esValido = montoNumero > 0

  async function guardar() {
    if (!esValido || guardando) return
    setGuardando(true)
    if (editandoId != null) {
      await editarGasto(db, editandoId, { monto: montoNumero, descripcion, tipo })
    } else {
      await registrarGasto(db, { monto: montoNumero, descripcion, tipo })
    }
    router.back()
  }

  return (
    <View className="flex-1 gap-6 bg-white p-6 dark:bg-zinc-900">
      <Stack.Screen options={{ title: editandoId != null ? 'Editar gasto' : 'Registrar gasto' }} />
      <TextInput
        autoFocus
        value={monto}
        onChangeText={setMonto}
        placeholder="$0"
        placeholderTextColor="#A1A1AA"
        keyboardType="decimal-pad"
        className="text-center text-6xl font-bold text-zinc-900 dark:text-zinc-100"
      />

      <TextInput
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Descripción (opcional)"
        placeholderTextColor="#A1A1AA"
        className="rounded-xl bg-zinc-100 px-4 py-3 text-base text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
      />

      <View className="flex-row gap-3">
        <TipoChip label="Variable" selected={tipo === 'variable'} onPress={() => setTipo('variable')} />
        <TipoChip label="Imprevisto" selected={tipo === 'imprevisto'} onPress={() => setTipo('imprevisto')} />
      </View>

      <Pressable
        onPress={guardar}
        disabled={!esValido || guardando}
        className={`items-center rounded-xl py-4 ${esValido ? 'bg-green-600 active:bg-green-700' : 'bg-zinc-300 dark:bg-zinc-700'}`}
      >
        <Text className="text-base font-semibold text-white">{editandoId != null ? 'Guardar cambios' : 'Guardar'}</Text>
      </Pressable>
    </View>
  )
}

function TipoChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center rounded-xl py-3 ${
        selected ? 'bg-green-600' : 'bg-zinc-100 dark:bg-zinc-800'
      }`}
    >
      <Text className={selected ? 'font-semibold text-white' : 'text-zinc-700 dark:text-zinc-300'}>{label}</Text>
    </Pressable>
  )
}
