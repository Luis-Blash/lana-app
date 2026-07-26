import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { Screen } from '@/components/Screen'
import { BotonPrimario, Help, SectionTitle, TextField } from '@/components/ui'
import { deleteIngresoFijo, getIngresosFijos, insertIngresoFijo, updateIngresoFijo } from '@/db/queries'
import { IngresoFijo } from '@/domain/types'
import { formatMXN } from '@/lib/format'
import { useFinanceStore } from '@/store/useFinanceStore'

export default function IngresosScreen() {
  const db = useSQLiteContext()
  const cargarStore = useFinanceStore((s) => s.cargar)

  const [ingresos, setIngresos] = useState<IngresoFijo[]>([])
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [nombre, setNombre] = useState('')
  const [monto, setMonto] = useState('')
  const [diaDelMes, setDiaDelMes] = useState('')

  const recargar = useCallback(async () => {
    setIngresos(await getIngresosFijos(db))
    await cargarStore(db)
  }, [db, cargarStore])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde SQLite
    recargar()
  }, [recargar])

  function limpiar() {
    setEditandoId(null)
    setNombre('')
    setMonto('')
    setDiaDelMes('')
  }

  function cargarParaEditar(i: IngresoFijo) {
    setEditandoId(i.id)
    setNombre(i.nombre)
    setMonto(String(i.monto))
    setDiaDelMes(String(i.diaDelMes))
  }

  async function guardar() {
    if (!nombre || !monto || !diaDelMes) return
    const datos = { nombre, monto: Number(monto), diaDelMes: Number(diaDelMes) }
    if (editandoId != null) {
      await updateIngresoFijo(db, editandoId, datos)
    } else {
      await insertIngresoFijo(db, datos)
    }
    limpiar()
    await recargar()
  }

  const total = ingresos.reduce((s, i) => s + i.monto, 0)

  return (
    <Screen gap={12}>
      <SectionTitle>Ingresos fijos</SectionTitle>
      <Help>El dinero que te entra cada mes: sueldo, quincena, bono. Toca uno para editarlo.</Help>

      <View className="flex-row items-center justify-between rounded-xl bg-green-100 px-4 py-3 dark:bg-green-950">
        <Text className="font-medium text-green-800 dark:text-green-300">Total al mes</Text>
        <Text className="text-lg font-bold tabular-nums text-green-700 dark:text-green-300">{formatMXN(total)}</Text>
      </View>

      {ingresos.map((i) => (
        <Pressable
          key={i.id}
          onPress={() => cargarParaEditar(i)}
          className={`flex-row items-center justify-between rounded-lg px-4 py-3 ${
            editandoId === i.id ? 'bg-green-100 dark:bg-green-950' : 'bg-zinc-100 dark:bg-zinc-800'
          }`}
        >
          <View>
            <Text className="font-medium text-zinc-900 dark:text-zinc-100">{i.nombre}</Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">Te cae el día {i.diaDelMes}</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Text className="tabular-nums text-zinc-700 dark:text-zinc-300">{formatMXN(i.monto)}</Text>
            <Pressable
              onPress={async () => {
                await deleteIngresoFijo(db, i.id)
                if (editandoId === i.id) limpiar()
                await recargar()
              }}
              hitSlop={8}
            >
              <Text className="text-red-500">Eliminar</Text>
            </Pressable>
          </View>
        </Pressable>
      ))}

      <View className="mt-2 flex-row gap-2">
        <TextField label="Nombre" value={nombre} onChangeText={setNombre} />
        <TextField label="Cuánto" value={monto} onChangeText={setMonto} keyboardType="decimal-pad" />
        <TextField label="Qué día" value={diaDelMes} onChangeText={setDiaDelMes} keyboardType="numeric" />
      </View>
      <BotonPrimario label={editandoId != null ? 'Guardar cambios' : 'Agregar ingreso'} onPress={guardar} />
      {editandoId != null ? (
        <Pressable onPress={limpiar} className="items-center py-1">
          <Text className="text-sm text-zinc-500 dark:text-zinc-400">Cancelar edición</Text>
        </Pressable>
      ) : null}
    </Screen>
  )
}
