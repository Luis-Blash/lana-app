import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'

import { insertCompraMsi, insertGastoFijo, getTransaccion } from '@/db/queries'
import { addMonths, monthKey } from '@/domain/month'
import { calcularMensualidad } from '@/domain/msi'
import { YearMonth } from '@/domain/types'
import { formatMesCorto } from '@/lib/format'
import { mesActual, ventanaMeses } from '@/lib/fechas'
import { useFinanceStore } from '@/store/useFinanceStore'

type TipoRegistro = 'dia_a_dia' | 'imprevisto' | 'meses' | 'suscripcion'

const PLAZOS = [2, 3, 6, 12]

export default function RegistrarScreen() {
  const db = useSQLiteContext()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const editandoId = id ? Number(id) : null

  const registrarGasto = useFinanceStore((s) => s.registrarGasto)
  const editarGasto = useFinanceStore((s) => s.editarGasto)
  const mesVisible = useFinanceStore((s) => s.mesVisible)
  const cargar = useFinanceStore((s) => s.cargar)

  const [tipo, setTipo] = useState<TipoRegistro>('dia_a_dia')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [mes, setMes] = useState<YearMonth>(mesVisible)
  const [plazo, setPlazo] = useState(3)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (editandoId == null) return
    getTransaccion(db, editandoId).then((t) => {
      if (!t) return
      setMonto(String(t.monto))
      setDescripcion(t.descripcion)
      setTipo(t.tipo === 'imprevisto' ? 'imprevisto' : 'dia_a_dia')
      setMes({ anio: Number(t.fecha.slice(0, 4)), mes: Number(t.fecha.slice(5, 7)) })
    })
  }, [db, editandoId])

  const montoNumero = Number(monto.replace(',', '.'))
  const esValido = montoNumero > 0
  const siempre = tipo === 'suscripcion' && plazo === 0

  function fechaDeMes(ym: YearMonth): string {
    const esMesActual = monthKey(ym) === monthKey(mesActual())
    const dia = esMesActual ? new Date().getDate() : 1
    return `${ym.anio}-${String(ym.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  }

  async function guardar() {
    if (!esValido || guardando) return
    setGuardando(true)

    if (editandoId != null) {
      await editarGasto(db, editandoId, {
        monto: montoNumero,
        descripcion,
        tipo: tipo === 'imprevisto' ? 'imprevisto' : 'variable',
        fecha: fechaDeMes(mes),
      })
      router.back()
      return
    }

    switch (tipo) {
      case 'dia_a_dia':
      case 'imprevisto':
        await registrarGasto(db, {
          monto: montoNumero,
          descripcion,
          tipo: tipo === 'imprevisto' ? 'imprevisto' : 'variable',
          fecha: fechaDeMes(mes),
        })
        break
      case 'meses':
        await insertCompraMsi(db, {
          descripcion: descripcion || 'Compra a meses',
          montoTotal: montoNumero,
          numMeses: plazo,
          mensualidad: calcularMensualidad(montoNumero, plazo),
          fechaInicio: mes,
          activa: true,
        })
        await cargar(db)
        break
      case 'suscripcion':
        await insertGastoFijo(db, {
          nombre: descripcion || 'Suscripción',
          montoMin: montoNumero,
          montoMax: montoNumero,
          frecuencia: 'mensual',
          diaDelMes: null,
          diaSemana: null,
          cadaNMeses: null,
          mesAncla: null,
          inicio: mes,
          fin: siempre ? null : addMonths(mes, plazo - 1),
        })
        await cargar(db)
        break
    }
    router.back()
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-zinc-900" contentContainerStyle={{ padding: 24, gap: 20 }}>
      <Stack.Screen options={{ title: editandoId != null ? 'Editar gasto' : 'Registrar' }} />

      {editandoId == null && (
        <View className="flex-row flex-wrap gap-2">
          <TipoChip label="Día a día" selected={tipo === 'dia_a_dia'} onPress={() => setTipo('dia_a_dia')} />
          <TipoChip label="Imprevisto" selected={tipo === 'imprevisto'} onPress={() => setTipo('imprevisto')} />
          <TipoChip label="A meses" selected={tipo === 'meses'} onPress={() => setTipo('meses')} />
          <TipoChip label="Suscripción" selected={tipo === 'suscripcion'} onPress={() => setTipo('suscripcion')} />
        </View>
      )}

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
        placeholder="Descripción"
        placeholderTextColor="#A1A1AA"
        className="rounded-xl bg-zinc-100 px-4 py-3 text-base text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
      />

      {(tipo === 'meses' || tipo === 'suscripcion') && (
        <View className="gap-2">
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
            {tipo === 'meses' ? 'Monto total y a cuántos meses' : '¿Por cuántos meses?'}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PLAZOS.map((p) => (
              <Pressable
                key={p}
                onPress={() => setPlazo(p)}
                className={`rounded-full px-3 py-2 ${plazo === p ? 'bg-green-600' : 'bg-zinc-100 dark:bg-zinc-800'}`}
              >
                <Text className={plazo === p ? 'font-medium text-white' : 'text-zinc-700 dark:text-zinc-300'}>
                  {p} meses
                </Text>
              </Pressable>
            ))}
            {tipo === 'suscripcion' && (
              <Pressable
                onPress={() => setPlazo(0)}
                className={`rounded-full px-3 py-2 ${plazo === 0 ? 'bg-green-600' : 'bg-zinc-100 dark:bg-zinc-800'}`}
              >
                <Text className={plazo === 0 ? 'font-medium text-white' : 'text-zinc-700 dark:text-zinc-300'}>
                  Para siempre
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {(tipo === 'dia_a_dia' || tipo === 'imprevisto' || tipo === 'meses' || tipo === 'suscripcion') && (
        <View className="gap-2">
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
            {tipo === 'dia_a_dia' || tipo === 'imprevisto' ? '¿Cuándo?' : '¿Desde cuándo?'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {ventanaMeses(3, 6).map((m) => (
              <Pressable
                key={monthKey(m)}
                onPress={() => setMes(m)}
                className={`rounded-full px-3 py-2 ${
                  monthKey(m) === monthKey(mes) ? 'bg-green-600' : 'bg-zinc-100 dark:bg-zinc-800'
                }`}
              >
                <Text
                  className={
                    monthKey(m) === monthKey(mes) ? 'font-medium text-white' : 'text-zinc-700 dark:text-zinc-300'
                  }
                >
                  {formatMesCorto(m)} {m.anio}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <Pressable
        onPress={guardar}
        disabled={!esValido || guardando}
        className={`items-center rounded-xl py-4 ${esValido ? 'bg-green-600 active:bg-green-700' : 'bg-zinc-300 dark:bg-zinc-700'}`}
      >
        <Text className="text-base font-semibold text-white">{editandoId != null ? 'Guardar cambios' : 'Guardar'}</Text>
      </Pressable>
    </ScrollView>
  )
}

function TipoChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-xl px-4 py-3 ${selected ? 'bg-green-600' : 'bg-zinc-100 dark:bg-zinc-800'}`}
    >
      <Text className={selected ? 'font-semibold text-white' : 'text-zinc-700 dark:text-zinc-300'}>{label}</Text>
    </Pressable>
  )
}
