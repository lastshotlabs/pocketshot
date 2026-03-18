export function settingsEmailOtpTemplate(): string {
  return `import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useEmailOtpEnable, useEmailOtpVerifySetup, useMfaMethods } from '@/lib/pocketshot'

export default function EmailOtpScreen() {
  const [code, setCode] = useState('')
  const { data: methods } = useMfaMethods()
  const { mutate: enable, isPending: enabling, isSuccess: enabled } = useEmailOtpEnable()
  const { mutate: verify, isPending: verifying, isSuccess: verified, error } = useEmailOtpVerifySetup()

  const isAlreadyEnabled = methods?.some((m: { type: string; enabled: boolean }) => m.type === 'email_otp' && m.enabled)

  if (isAlreadyEnabled || verified) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Email OTP enabled</Text>
        <Text style={styles.message}>You'll receive a code by email when logging in.</Text>
      </View>
    )
  }

  if (enabled) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.message}>Enter the code we sent to your email address.</Text>
        <TextInput
          style={styles.input}
          placeholder="6-digit code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />
        {error && <Text style={styles.error}>{(error as Error).message}</Text>}
        <TouchableOpacity style={styles.button} onPress={() => verify({ code })} disabled={verifying}>
          {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Email OTP</Text>
      <Text style={styles.message}>Receive one-time codes by email as a second factor.</Text>
      <TouchableOpacity style={styles.button} onPress={() => enable()} disabled={enabling}>
        {enabling ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enable email OTP</Text>}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  message: { color: '#555', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#007AFF', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: 'red', marginBottom: 12 },
})
`
}
