/**
 * Handles the OAuth deep link callback: pocketshot://auth/callback?code=xxx
 * Exchanges the code for tokens and navigates to the app.
 */
import { useEffect } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useExchangeOAuthCode } from '@/lib/auth'

export default function OAuthCallbackScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const exchangeOAuthCode = useExchangeOAuthCode()

  useEffect(() => {
    if (!code) {
      router.replace('/(auth)/login')
      return
    }
    exchangeOAuthCode.mutate({ code }, {
      onError: () => router.replace('/(auth)/login'),
    })
  }, [code])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 16, color: '#666' }}>Completing sign in\u2026</Text>
    </View>
  )
}
