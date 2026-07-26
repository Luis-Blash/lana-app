import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'

import { Screen } from '@/components/Screen'
import { BotonPrimario, Help, SectionTitle, TextField } from '@/components/ui'
import {
  getEstadoMensual,
  getReservaAporteMes,
  getReservaMontoDefault,
  getTransaccionesDelMes,
  resetHistorial,
  setReservaMontoDefault,
  setReservaOverrideMes,
  setSaldosIniciales,
} from '@/db/queries'
import { formatMXN } from '@/lib/format'
import { mesActual, mesAncla } from '@/lib/fechas'
import { useFinanceStore } from '@/store/useFinanceStore'

export default function ApartadosScreen() {
  const db = useSQLiteContext()
  const cargarStore = useFinanceStore((s) => s.cargar)

  const [reservaDefault, setReservaDefaultState] = useState(0)
  const [colchonInicial, setColchonInicial] = useState(0)
  const [reservaInicial, setReservaInicial] = useState(0)
  const [aporteMes, setAporteMes] = useState(0)
  const [imprevistosMes, setImprevistosMes] = useState(0)

  const recargar = useCallback(async () => {
    const [reservaDefaultData, ancla, aporte, transacciones] = await Promise.all([
      getReservaMontoDefault(db),
      getEstadoMensual(db, mesAncla()),
      getReservaAporteMes(db, mesActual()),
      getTransaccionesDelMes(db, mesActual()),
    ])
    setReservaDefaultState(reservaDefaultData)
    setColchonInicial(ancla?.colchonAcumulado ?? 0)
    setReservaInicial(ancla?.reservaSaldo ?? 0)
    setAporteMes(aporte)
    setImprevistosMes(transacciones.filter((t) => t.tipo === 'imprevisto').reduce((s, t) => s + t.monto, 0))
    await cargarStore(db)
  }, [db, cargarStore])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde SQLite
    recargar()
  }, [recargar])

  function confirmarReset() {
    Alert.alert(
      'Empezar de cero',
      'Esto pone tu colchón y tu reserva ahorrada en $0. No borra tus ingresos, gastos fijos ni los gastos que ya registraste.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Empezar de cero',
          style: 'destructive',
          onPress: async () => {
            await resetHistorial(db, mesAncla())
            await recargar()
          },
        },
      ],
    )
  }

  return (
    <Screen>
      <SaldosSection
        key={`${colchonInicial}-${reservaInicial}`}
        colchonInicial={colchonInicial}
        reservaInicial={reservaInicial}
        onGuardar={async (colchon, reserva) => {
          await setSaldosIniciales(db, mesAncla(), colchon, reserva)
          await recargar()
        }}
        onReset={confirmarReset}
      />

      <ReservaSection
        key={`res-${reservaDefault}`}
        montoDefault={reservaDefault}
        reservaInicial={reservaInicial}
        aporteMes={aporteMes}
        imprevistosMes={imprevistosMes}
        onGuardarDefault={async (monto) => {
          await setReservaMontoDefault(db, monto)
          await recargar()
        }}
        onGuardarSoloEsteMes={async (monto) => {
          await setReservaOverrideMes(db, mesActual(), monto)
          await recargar()
        }}
      />
    </Screen>
  )
}

function SaldosSection({
  colchonInicial,
  reservaInicial,
  onGuardar,
  onReset,
}: {
  colchonInicial: number
  reservaInicial: number
  onGuardar: (colchon: number, reserva: number) => void
  onReset: () => void
}) {
  const [colchon, setColchon] = useState(String(colchonInicial))
  const [reserva, setReserva] = useState(String(reservaInicial))

  return (
    <View className="gap-3">
      <SectionTitle>Lo que ya tienes hoy</SectionTitle>
      <Help>
        Dile a la app con cuánto arrancas. De aquí en adelante ella los va sumando o restando sola cada mes, pero
        siempre los puedes corregir.
      </Help>

      <View className="gap-1">
        <Text className="text-sm text-zinc-700 dark:text-zinc-300">Dinero libre que traes (colchón)</Text>
        <TextField value={colchon} onChangeText={setColchon} keyboardType="decimal-pad" />
      </View>

      <View className="gap-1">
        <Text className="text-sm text-zinc-700 dark:text-zinc-300">Ahorro que ya tienes para imprevistos</Text>
        <TextField value={reserva} onChangeText={setReserva} keyboardType="decimal-pad" />
      </View>

      <BotonPrimario label="Guardar saldos" onPress={() => onGuardar(Number(colchon) || 0, Number(reserva) || 0)} />

      <Pressable
        onPress={onReset}
        className="rounded-lg border border-red-300 px-4 py-3 active:bg-red-50 dark:border-red-900 dark:active:bg-red-950"
      >
        <Text className="text-center font-medium text-red-600 dark:text-red-400">Empezar de cero</Text>
      </Pressable>
    </View>
  )
}

function ReservaSection({
  montoDefault,
  reservaInicial,
  aporteMes,
  imprevistosMes,
  onGuardarDefault,
  onGuardarSoloEsteMes,
}: {
  montoDefault: number
  reservaInicial: number
  aporteMes: number
  imprevistosMes: number
  onGuardarDefault: (monto: number) => void
  onGuardarSoloEsteMes: (monto: number) => void
}) {
  const [valorDefault, setValorDefault] = useState(String(montoDefault))
  const [mostrarEsteMes, setMostrarEsteMes] = useState(false)
  const [valorMes, setValorMes] = useState('')

  const disponibleAhora = reservaInicial + aporteMes - imprevistosMes

  return (
    <View className="gap-3">
      <SectionTitle>Cuánto apartas para imprevistos</SectionTitle>
      <Help>
        Cada mes la app guarda esta cantidad aparte (medicinas, cosas inesperadas) antes de decirte cuánto te queda
        libre. Así nunca te agarran desprevenido.
      </Help>

      <View className="gap-1 rounded-xl bg-amber-100 px-4 py-3 dark:bg-amber-950">
        <View className="flex-row items-center justify-between">
          <Text className="font-medium text-amber-800 dark:text-amber-200">Reserva disponible ahora</Text>
          <Text className="text-lg font-bold tabular-nums text-amber-700 dark:text-amber-200">
            {formatMXN(disponibleAhora)}
          </Text>
        </View>
        <Text className="text-xs text-amber-700/80 dark:text-amber-200/80">
          Traías {formatMXN(reservaInicial)} + {formatMXN(aporteMes)} este mes
          {imprevistosMes > 0 ? ` − ${formatMXN(imprevistosMes)} que ya usaste en imprevistos` : ''}.
        </Text>
      </View>

      <View className="flex-row items-end gap-2">
        <TextField label="Cada mes aparto" value={valorDefault} onChangeText={setValorDefault} keyboardType="decimal-pad" />
        <BotonPrimario label="Guardar" onPress={() => onGuardarDefault(Number(valorDefault) || 0)} />
      </View>

      {!mostrarEsteMes ? (
        <Pressable onPress={() => setMostrarEsteMes(true)}>
          <Text className="text-sm text-green-600 dark:text-green-400">Este mes quiero apartar otra cantidad</Text>
        </Pressable>
      ) : (
        <View className="flex-row items-end gap-2">
          <TextField label="Solo este mes apartar" value={valorMes} onChangeText={setValorMes} keyboardType="decimal-pad" />
          <BotonPrimario
            label="Aplicar"
            onPress={() => {
              onGuardarSoloEsteMes(Number(valorMes) || 0)
              setMostrarEsteMes(false)
              setValorMes('')
            }}
          />
        </View>
      )}
    </View>
  )
}
