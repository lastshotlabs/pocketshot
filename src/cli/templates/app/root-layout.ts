export function rootLayoutTemplate(): string {
  return `import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Providers } from '@/lib/pocketshot'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Providers>
        <Stack screenOptions={{ headerShown: false }} />
      </Providers>
    </SafeAreaProvider>
  )
}
`
}
