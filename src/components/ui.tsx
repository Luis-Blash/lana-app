import { Pressable, Text, TextInput, View } from 'react-native'

export function SectionTitle({ children }: { children: string }) {
  return <Text className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{children}</Text>
}

export function Help({ children }: { children: string }) {
  return <Text className="text-xs leading-4 text-zinc-500 dark:text-zinc-400">{children}</Text>
}

export function TextField({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label?: string
  value: string
  onChangeText: (v: string) => void
  keyboardType?: 'default' | 'numeric' | 'decimal-pad'
}) {
  return (
    <View className="flex-1 gap-1">
      {label ? <Text className="text-xs text-zinc-500 dark:text-zinc-400">{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        className="rounded-lg bg-zinc-100 px-3 py-2 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
      />
    </View>
  )
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-3 py-2 ${selected ? 'bg-green-600' : 'bg-zinc-100 dark:bg-zinc-800'}`}
    >
      <Text className={selected ? 'text-sm font-medium text-white' : 'text-sm text-zinc-700 dark:text-zinc-300'}>
        {label}
      </Text>
    </Pressable>
  )
}

export function BotonPrimario({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="rounded-lg bg-green-600 px-4 py-3 active:bg-green-700">
      <Text className="text-center font-medium text-white">{label}</Text>
    </Pressable>
  )
}
