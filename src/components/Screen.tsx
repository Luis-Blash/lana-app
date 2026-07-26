import { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/** ScrollView con aire arriba/abajo respetando el notch y la barra de pestañas. */
export function Screen({ children, gap = 32 }: { children: ReactNode; gap?: number }) {
  const insets = useSafeAreaInsets()
  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-zinc-900"
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 24,
        gap,
      }}
    >
      {children}
    </ScrollView>
  )
}
