import { useEffect } from 'react'
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useVerifyEmail } from '@/lib/pocketshot'

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const router = useRouter()
  const { mutate, isPending, isSuccess, error } = useVerifyEmail()

  useEffect(() => {
    if (token) mutate({ token })
  }, [token])

  if (isPending) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.message}>Verifying your email\u2026</Text>
      </View>
    )
  }

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Email verified!</Text>
        <TouchableOpacity onPress={() => router.replace('/(app)/')}>
          <Text style={styles.link}>Continue</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verification failed</Text>
      <Text style={styles.error}>{error ? (error as Error).message : 'Invalid or expired link.'}</Text>
      <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.link}>Back to login</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  message: { marginTop: 16, color: '#555' },
  link: { color: '#007AFF', marginTop: 16 },
  error: { color: 'red', textAlign: 'center' },
})
