import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useEffect } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EmptyState } from '@/components/EmptyState'
import { HeroDisponible } from '@/components/HeroDisponible'
import { MonthNav } from '@/components/MonthNav'
import { MovimientosMes } from '@/components/MovimientosMes'
import { ProjectionStrip } from '@/components/ProjectionStrip'
import { estaVigenteEnMes } from '@/domain/disponible'
import { estaActivaEnMes, mesesAfectados } from '@/domain/msi'
import { monthKey } from '@/domain/month'
import { formatMesCorto, formatMXN } from '@/lib/format'
import { mesActual } from '@/lib/fechas'
import { useFinanceStore } from '@/store/useFinanceStore'

export default function InicioScreen() {
  const db = useSQLiteContext()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const {
    cargando,
    mesVisible,
    irAMes,
    mesAnterior,
    mesSiguiente,
    volverAHoy,
    sliceVisible,
    transaccionesVisibles,
    proyeccionBase,
    ingresosFijos,
    gastosFijos,
    comprasMsi,
    cargar,
    eliminarGasto,
  } = useFinanceStore()

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

  const sinIngresos = ingresosFijos.length === 0

  const compromisos = [
    ...gastosFijos
      .filter((g) => g.fin && estaVigenteEnMes(g, mesVisible))
      .map((g) => ({ nombre: g.nombre, texto: `hasta ${formatMesCorto(g.fin!)}` })),
    ...comprasMsi
      .filter((c) => estaActivaEnMes(c, mesVisible))
      .map((c) => {
        const meses = mesesAfectados(c.fechaInicio, c.numMeses)
        const restantes = meses.filter((m) => monthKey(m) >= monthKey(mesVisible)).length
        return { nombre: c.descripcion, texto: `quedan ${restantes} de ${c.numMeses}` }
      }),
  ]

  return (
    <View className="flex-1 bg-white dark:bg-zinc-900">
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96, paddingHorizontal: 24, gap: 24 }}
      >
        <MonthNav
          ym={mesVisible}
          esHoy={monthKey(mesVisible) === monthKey(mesActual())}
          onAnterior={mesAnterior}
          onSiguiente={mesSiguiente}
          onHoy={volverAHoy}
        />

        {sinIngresos ? (
          <EmptyState
            titulo="Todavía no hay nada aquí"
            texto="Agrega tu primer ingreso para que lana pueda calcular cuánto tienes disponible."
            accion="Agregar mi ingreso"
            onAccion={() => router.push('/ingresos')}
          />
        ) : sliceVisible ? (
          <>
            <HeroDisponible
              disponible={sliceVisible.disponible}
              enRojo={sliceVisible.enRojo}
              saldoDelMes={sliceVisible.saldoDelMes}
              enRojoDelMes={sliceVisible.enRojoDelMes}
              colchonEntrante={sliceVisible.colchonEntrante}
            />

            <ProjectionStrip meses={proyeccionBase} mesVisible={mesVisible} onSeleccionar={irAMes} />

            <View className="gap-2 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
              <Row label="Ingresos" valor={sliceVisible.ingresos} />
              <Row label="Gastos fijos" valor={-sliceVisible.gastosFijos} />
              <Row label="Pagos a meses sin intereses" valor={-sliceVisible.msiTotal} />
              <Row label="Apartado para imprevistos" valor={-sliceVisible.reservaAporte} />
              <Row label="Gastos del día a día" valor={-sliceVisible.variablesGastados} />
              {sliceVisible.imprevistosExceso > 0 && (
                <Row label="Imprevistos que no cubrió tu reserva" valor={-sliceVisible.imprevistosExceso} />
              )}
              <Row label="Te sobró el mes pasado" valor={sliceVisible.colchonEntrante} />
            </View>
            <Text className="-mt-4 px-1 text-xs text-zinc-500 dark:text-zinc-400">
              Lo que te sobra cada mes se guarda solo y se suma al siguiente. Si te pasas de gasto, se resta.
            </Text>

            {compromisos.length > 0 && (
              <View className="gap-2">
                <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Compromisos activos</Text>
                <View className="gap-1 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
                  {compromisos.map((c, i) => (
                    <View key={i} className="flex-row justify-between">
                      <Text className="text-zinc-700 dark:text-zinc-300">{c.nombre}</Text>
                      <Text className="text-xs text-zinc-500 dark:text-zinc-400">{c.texto}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <MovimientosMes
              transacciones={transaccionesVisibles}
              onEditar={(id) => router.push(`/registrar?id=${id}`)}
              onEliminar={(id) => eliminarGasto(db, id)}
            />
          </>
        ) : null}
      </ScrollView>

      {!sinIngresos && (
        <Pressable
          onPress={() => router.push('/registrar')}
          style={{ bottom: insets.bottom + 16 }}
          className="absolute right-6 flex-row items-center gap-2 rounded-full bg-green-600 px-5 py-4 shadow-lg active:bg-green-700"
        >
          <Ionicons name="add" color="white" size={22} />
          <Text className="text-base font-semibold text-white">Gasto</Text>
        </Pressable>
      )}
    </View>
  )
}

function Row({ label, valor }: { label: string; valor: number }) {
  const color = valor < 0 ? 'text-red-500 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'
  return (
    <View className="flex-row justify-between">
      <Text className="text-zinc-600 dark:text-zinc-400">{label}</Text>
      <Text className={`tabular-nums ${color}`}>{formatMXN(valor)}</Text>
    </View>
  )
}
