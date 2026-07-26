import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { Screen } from '@/components/Screen'
import { BotonPrimario, Chip, Help, SectionTitle, TextField } from '@/components/ui'
import { deleteGastoFijo, getGastosFijos, insertGastoFijo } from '@/db/queries'
import { Frecuencia, GastoFijo } from '@/domain/types'
import { DIAS_SEMANA, proximosMeses } from '@/lib/fechas'
import { formatMesCorto, formatMXN } from '@/lib/format'
import { useFinanceStore } from '@/store/useFinanceStore'

export default function GastosScreen() {
  const db = useSQLiteContext()
  const cargarStore = useFinanceStore((s) => s.cargar)
  const totalMes = useFinanceStore((s) => s.slice?.gastosFijos ?? 0)

  const [gastos, setGastos] = useState<GastoFijo[]>([])

  const [nombre, setNombre] = useState('')
  const [monto, setMonto] = useState('')
  const [montoMax, setMontoMax] = useState('')
  const [varia, setVaria] = useState(false)
  const [frecuencia, setFrecuencia] = useState<Frecuencia>('mensual')
  const [diaDelMes, setDiaDelMes] = useState('')
  const [diaSemana, setDiaSemana] = useState<number | null>(null)
  const [cadaNMeses, setCadaNMeses] = useState(2)
  const [proximoMes, setProximoMes] = useState<number | null>(null)

  const recargar = useCallback(async () => {
    setGastos(await getGastosFijos(db))
    await cargarStore(db)
  }, [db, cargarStore])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde SQLite
    recargar()
  }, [recargar])

  function limpiar() {
    setNombre('')
    setMonto('')
    setMontoMax('')
    setVaria(false)
    setDiaDelMes('')
    setDiaSemana(null)
    setCadaNMeses(2)
    setProximoMes(null)
  }

  async function agregar() {
    if (!nombre || !monto) return
    const min = Number(monto)
    const max = varia && montoMax ? Number(montoMax) : min
    await insertGastoFijo(db, {
      nombre,
      montoMin: min,
      montoMax: max,
      frecuencia,
      diaDelMes: frecuencia === 'mensual' ? Number(diaDelMes) || null : null,
      diaSemana: frecuencia === 'semanal' ? diaSemana : null,
      cadaNMeses: frecuencia === 'cada_n_meses' ? cadaNMeses : null,
      mesAncla: frecuencia === 'cada_n_meses' ? proximoMes : null,
    })
    limpiar()
    await recargar()
  }

  return (
    <Screen gap={12}>
      <SectionTitle>Gastos fijos</SectionTitle>
      <Help>Lo que pagas seguido: suscripciones, despensa, efectivo semanal, cosas cada varios meses.</Help>

      <View className="rounded-xl bg-red-100 px-4 py-3 dark:bg-red-950">
        <View className="flex-row items-center justify-between">
          <Text className="font-medium text-red-800 dark:text-red-300">Total este mes</Text>
          <Text className="text-lg font-bold tabular-nums text-red-700 dark:text-red-300">{formatMXN(totalMes)}</Text>
        </View>
        <Text className="mt-0.5 text-xs text-red-700/70 dark:text-red-300/70">
          Aprox: cuenta las semanas reales del mes y el monto alto en los que varían.
        </Text>
      </View>

      {gastos.map((g) => (
        <View key={g.id} className="flex-row items-center justify-between rounded-lg bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
          <View className="flex-1 pr-2">
            <Text className="font-medium text-zinc-900 dark:text-zinc-100">{g.nombre}</Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">{describeFrecuencia(g)}</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Text className="tabular-nums text-zinc-700 dark:text-zinc-300">
              {g.montoMin === g.montoMax ? formatMXN(g.montoMin) : `${formatMXN(g.montoMin)}–${formatMXN(g.montoMax)}`}
            </Text>
            <Pressable
              onPress={async () => {
                await deleteGastoFijo(db, g.id)
                await recargar()
              }}
            >
              <Text className="text-red-500">Eliminar</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <View className="mt-2 gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <View className="flex-row gap-2">
          <TextField label="Nombre" value={nombre} onChangeText={setNombre} />
          <TextField label="Cuánto" value={monto} onChangeText={setMonto} keyboardType="decimal-pad" />
        </View>

        <Pressable onPress={() => setVaria((v) => !v)} className="flex-row items-center gap-2 py-1">
          <View className={`h-5 w-5 items-center justify-center rounded ${varia ? 'bg-green-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
            {varia ? <Text className="text-xs text-white">✓</Text> : null}
          </View>
          <Text className="text-sm text-zinc-700 dark:text-zinc-300">El monto varía (ej. despensa de $300 a $480)</Text>
        </Pressable>
        {varia ? <TextField label="Hasta cuánto llega" value={montoMax} onChangeText={setMontoMax} keyboardType="decimal-pad" /> : null}

        <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">¿Cada cuándo?</Text>
        <View className="flex-row flex-wrap gap-2">
          <Chip label="Cada mes" selected={frecuencia === 'mensual'} onPress={() => setFrecuencia('mensual')} />
          <Chip label="Cada semana" selected={frecuencia === 'semanal'} onPress={() => setFrecuencia('semanal')} />
          <Chip label="Cada varios meses" selected={frecuencia === 'cada_n_meses'} onPress={() => setFrecuencia('cada_n_meses')} />
        </View>

        {frecuencia === 'mensual' && (
          <TextField label="¿Qué día del mes?" value={diaDelMes} onChangeText={setDiaDelMes} keyboardType="numeric" />
        )}

        {frecuencia === 'semanal' && (
          <>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">¿Qué día de la semana?</Text>
            <View className="flex-row flex-wrap gap-2">
              {DIAS_SEMANA.map((d, idx) => (
                <Chip key={d} label={d} selected={diaSemana === idx} onPress={() => setDiaSemana(idx)} />
              ))}
            </View>
          </>
        )}

        {frecuencia === 'cada_n_meses' && (
          <>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">¿Cada cuántos meses?</Text>
            <View className="flex-row flex-wrap gap-2">
              {[2, 3, 6].map((n) => (
                <Chip key={n} label={`Cada ${n} meses`} selected={cadaNMeses === n} onPress={() => setCadaNMeses(n)} />
              ))}
            </View>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">¿Cuándo toca la próxima vez?</Text>
            <View className="flex-row flex-wrap gap-2">
              {proximosMeses(12).map((m) => (
                <Chip
                  key={`${m.anio}-${m.mes}`}
                  label={`${formatMesCorto(m)} ${m.anio}`}
                  selected={proximoMes === m.mes}
                  onPress={() => setProximoMes(m.mes)}
                />
              ))}
            </View>
          </>
        )}

        <BotonPrimario label="Agregar gasto fijo" onPress={agregar} />
      </View>
    </Screen>
  )
}

function describeFrecuencia(g: GastoFijo): string {
  if (g.frecuencia === 'mensual') return `Cada mes, el día ${g.diaDelMes}`
  if (g.frecuencia === 'semanal') return `Cada semana, ${DIAS_SEMANA[g.diaSemana ?? 0]}`
  const proxima = g.mesAncla ? ` · próxima: ${formatMesCorto({ anio: 0, mes: g.mesAncla })}` : ''
  return `Cada ${g.cadaNMeses} meses${proxima}`
}
