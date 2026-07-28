import { useSQLiteContext } from 'expo-sqlite'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Switch, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EmptyState } from '@/components/EmptyState'
import { MonthNav } from '@/components/MonthNav'
import { ProjectionStrip } from '@/components/ProjectionStrip'
import { BotonPrimario, Chip, TextField } from '@/components/ui'
import { mensualidadEscenario } from '@/domain/escenario'
import { monthKey } from '@/domain/month'
import { EscenarioItem, TipoEscenario, YearMonth } from '@/domain/types'
import { formatMesCorto, formatMXN } from '@/lib/format'
import { mesActual, ventanaMeses } from '@/lib/fechas'
import { useFinanceStore } from '@/store/useFinanceStore'

const TIPOS: { tipo: TipoEscenario; label: string }[] = [
  { tipo: 'unico', label: 'Gasto único' },
  { tipo: 'meses', label: 'A meses' },
  { tipo: 'recurrente', label: 'Suscripción' },
]

export default function SimuladorScreen() {
  const db = useSQLiteContext()
  const insets = useSafeAreaInsets()
  const {
    cargando,
    cargar,
    mesVisible,
    irAMes,
    mesAnterior,
    mesSiguiente,
    volverAHoy,
    escenario,
    escenarioActivo,
    setEscenarioActivo,
    sliceVisible,
    extrasVisible,
    proyeccionBase,
    proyeccionEscenario,
    agregarItemEscenario,
    toggleItemEscenario,
    eliminarItemEscenario,
    limpiarEscenarioAction,
    hacerRealItem,
  } = useFinanceStore()

  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => {
    cargar(db)
  }, [db, cargar])

  if (cargando) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-900">
        <Text className="text-zinc-500 dark:text-zinc-400">Cargando…</Text>
      </View>
    )
  }

  const impacto = escenarioActivo ? extrasVisible : 0
  const primerMesRojo = proyeccionEscenario.find((m) => m.enRojo)
  const veredicto = escenarioActivo && escenario.length > 0
    ? primerMesRojo
      ? `${formatMesCorto(primerMesRojo.ym)} se va a rojo: ${formatMXN(primerMesRojo.disponible)}`
      : 'Con este escenario ningún mes se va a rojo'
    : null

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-zinc-900"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 24,
        gap: 20,
      }}
    >
      <MonthNav
        ym={mesVisible}
        esHoy={monthKey(mesVisible) === monthKey(mesActual())}
        onAnterior={mesAnterior}
        onSiguiente={mesSiguiente}
        onHoy={volverAHoy}
      />

      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Escenario</Text>
        <Switch value={escenarioActivo} onValueChange={setEscenarioActivo} />
      </View>

      {sliceVisible && (
        <View className="gap-3 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
          <SaldoFila
            label="Disponible real"
            ayuda="Con lo que traías ahorrado de antes"
            valor={sliceVisible.disponible - impacto}
            valorSinEscenario={sliceVisible.disponible}
            mostrarSinEscenario={impacto > 0}
          />
          <View className="h-px bg-zinc-200 dark:bg-zinc-700" />
          <SaldoFila
            label="Este mes solo"
            ayuda="Sin contar lo que traías ahorrado"
            valor={sliceVisible.saldoDelMes - impacto}
            valorSinEscenario={sliceVisible.saldoDelMes}
            mostrarSinEscenario={impacto > 0}
          />
        </View>
      )}

      {escenario.length === 0 ? (
        <EmptyState
          titulo="Todavía no hay nada que simular"
          texto="Agrega una compra a meses, una suscripción o un gasto único y mira cómo le pega a los próximos meses."
        />
      ) : (
        <View className="gap-2">
          {escenario.map((item) => (
            <ItemEscenario
              key={item.id}
              item={item}
              onToggle={(activo) => toggleItemEscenario(db, item.id, activo)}
              onEliminar={() => eliminarItemEscenario(db, item.id)}
              onHacerReal={() => hacerRealItem(db, item.id)}
            />
          ))}
          <Pressable onPress={() => limpiarEscenarioAction(db)} hitSlop={8}>
            <Text className="text-center text-xs text-red-500">Limpiar escenario</Text>
          </Pressable>
        </View>
      )}

      {veredicto && (
        <View className={`rounded-xl p-4 ${primerMesRojo ? 'bg-red-100 dark:bg-red-950' : 'bg-green-100 dark:bg-green-950'}`}>
          <Text
            className={`font-semibold ${primerMesRojo ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}
          >
            {primerMesRojo ? '⚠ ' : '✓ '}
            {veredicto}
          </Text>
        </View>
      )}

      {mostrarForm ? (
        <FormularioItem
          onCancelar={() => setMostrarForm(false)}
          onGuardar={async (item) => {
            await agregarItemEscenario(db, item)
            setMostrarForm(false)
          }}
        />
      ) : (
        <BotonPrimario label="+ Agregar al escenario" onPress={() => setMostrarForm(true)} />
      )}

      <ProjectionStrip
        meses={proyeccionBase}
        mesesEscenario={escenarioActivo ? proyeccionEscenario : undefined}
        mesVisible={mesVisible}
        onSeleccionar={irAMes}
      />
    </ScrollView>
  )
}

function SaldoFila({
  label,
  ayuda,
  valor,
  valorSinEscenario,
  mostrarSinEscenario,
}: {
  label: string
  ayuda: string
  valor: number
  valorSinEscenario: number
  mostrarSinEscenario: boolean
}) {
  const color = valor < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-1 pr-2">
        <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</Text>
        <Text className="text-[11px] text-zinc-400 dark:text-zinc-500">{ayuda}</Text>
      </View>
      <View className="items-end">
        <Text className={`text-xl font-bold tabular-nums ${color}`}>{formatMXN(valor)}</Text>
        {mostrarSinEscenario && (
          <Text className="text-[11px] text-zinc-400 dark:text-zinc-500">
            sin escenario: {formatMXN(valorSinEscenario)}
          </Text>
        )}
      </View>
    </View>
  )
}

function ItemEscenario({
  item,
  onToggle,
  onEliminar,
  onHacerReal,
}: {
  item: EscenarioItem
  onToggle: (activo: boolean) => void
  onEliminar: () => void
  onHacerReal: () => void
}) {
  const mensualidad = mensualidadEscenario(item)
  const detalle =
    item.tipo === 'unico'
      ? `único · ${formatMesCorto(item.inicio)}`
      : item.tipo === 'meses'
        ? `${formatMXN(item.monto)} a ${item.numMeses} meses · desde ${formatMesCorto(item.inicio)}`
        : `suscripción · desde ${formatMesCorto(item.inicio)}`

  return (
    <View className="flex-row items-center justify-between rounded-xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
      <Pressable onPress={() => onToggle(!item.activo)} className="flex-1 flex-row items-center gap-3">
        <View
          className={`h-5 w-5 items-center justify-center rounded border-2 ${
            item.activo ? 'border-green-600 bg-green-600' : 'border-zinc-400'
          }`}
        >
          {item.activo && <Text className="text-xs font-bold text-white">✓</Text>}
        </View>
        <View className="flex-1">
          <Text className="font-medium text-zinc-900 dark:text-zinc-100">{item.descripcion}</Text>
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">{detalle}</Text>
        </View>
      </Pressable>
      <View className="items-end gap-1">
        <Text className="tabular-nums text-zinc-700 dark:text-zinc-300">−{formatMXN(mensualidad)}</Text>
        <View className="flex-row gap-3">
          <Pressable onPress={onHacerReal} hitSlop={8}>
            <Text className="text-xs font-medium text-green-600 dark:text-green-400">Hacerlo real</Text>
          </Pressable>
          <Pressable onPress={onEliminar} hitSlop={8}>
            <Text className="text-xs text-red-500">Quitar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

function FormularioItem({
  onCancelar,
  onGuardar,
}: {
  onCancelar: () => void
  onGuardar: (item: {
    tipo: TipoEscenario
    descripcion: string
    monto: number
    numMeses: number
    inicio: YearMonth
  }) => void
}) {
  const [tipo, setTipo] = useState<TipoEscenario>('meses')
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [numMeses, setNumMeses] = useState('3')
  const [inicio, setInicio] = useState<YearMonth>(mesActual())

  const montoNumero = Number(monto.replace(',', '.')) || 0
  const meses = tipo === 'unico' ? 1 : Math.max(1, Number(numMeses) || 1)
  const esValido = montoNumero > 0 && descripcion.trim().length > 0

  return (
    <View className="gap-3 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
      <View className="flex-row gap-2">
        {TIPOS.map((t) => (
          <Chip key={t.tipo} label={t.label} selected={tipo === t.tipo} onPress={() => setTipo(t.tipo)} />
        ))}
      </View>

      <TextField label="¿Qué es?" value={descripcion} onChangeText={setDescripcion} />
      <View className="flex-row gap-3">
        <TextField
          label={tipo === 'meses' ? 'Monto total' : 'Monto'}
          value={monto}
          onChangeText={setMonto}
          keyboardType="decimal-pad"
        />
        {tipo !== 'unico' && (
          <TextField label="¿Cuántos meses?" value={numMeses} onChangeText={setNumMeses} keyboardType="numeric" />
        )}
      </View>

      <View className="gap-1">
        <Text className="text-xs text-zinc-500 dark:text-zinc-400">¿Desde cuándo?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {ventanaMeses(0, 11).map((m) => (
            <Chip
              key={monthKey(m)}
              label={`${formatMesCorto(m)} ${m.anio}`}
              selected={monthKey(m) === monthKey(inicio)}
              onPress={() => setInicio(m)}
            />
          ))}
        </ScrollView>
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <BotonPrimario
            label="Agregar"
            onPress={() => {
              if (!esValido) return
              onGuardar({ tipo, descripcion, monto: montoNumero, numMeses: meses, inicio })
            }}
          />
        </View>
        <Pressable onPress={onCancelar} className="items-center justify-center px-4">
          <Text className="text-zinc-500 dark:text-zinc-400">Cancelar</Text>
        </Pressable>
      </View>
    </View>
  )
}
