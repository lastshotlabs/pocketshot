import { useEffect } from 'react'
import { LogBox } from 'react-native'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as SplashScreen from 'expo-splash-screen'
import { pocketshot } from '@/lib/pocketshot'

LogBox.ignoreLogs([
  "Codegen didn't run for",
  '[pocketshot] expo-sqlite not found',
])

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { Providers } = pocketshot

  useEffect(() => {
    void SplashScreen.hideAsync()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Providers>
        <Stack screenOptions={{ headerShown: false }} />
      </Providers>
    </GestureHandlerRootView>
  )
}
