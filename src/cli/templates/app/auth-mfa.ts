export function authMfaTemplate(): string {
  return `import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useVerifyMfa } from '@/lib/pocketshot'

export default function MfaScreen() {
  const { mfaToken, methods } = useLocalSearchParams<{ mfaToken: string; methods: string }>()
  const [code, setCode] = useState('')
  const method = methods?.split(',')[0] ?? 'totp'
  const { mutate: verifyMfa, isPending } = useVerifyMfa()

  function handleVerify() {
    if (!code || !mfaToken) return
    verifyMfa(
      { mfaToken, code, method },
      {
        onSuccess: () => router.replace('/(app)/'),
        onError: (err: any) => {
          Alert.alert('Verification failed', err.data?.error ?? err.message)
        },
      }
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Two-Factor Auth</Text>
      <Text style={styles.subtitle}>
        {method === 'emailOtp' ? 'Enter the code sent to your email.' : 'Enter your authenticator code.'}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="000000"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />
      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={isPending}>
        <Text style={styles.buttonText}>{isPending ? 'Verifying\u2026' : 'Verify'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#666', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 24, textAlign: 'center', letterSpacing: 8 },
  button: { backgroundColor: '#000', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
`
}
