export function authForgotPasswordTemplate(): string {
  return `import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useForgotPassword } from '@/lib/pocketshot'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const router = useRouter()
  const { mutate, isPending, isSuccess, error } = useForgotPassword()

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.message}>We sent a password reset link to {email}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Back to login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot password</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {error && <Text style={styles.error}>{(error as Error).message}</Text>}
      <TouchableOpacity style={styles.button} onPress={() => mutate({ email })} disabled={isPending}>
        {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send reset link</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Back to login</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  message: { fontSize: 16, marginBottom: 24, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#007AFF', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { color: '#007AFF', textAlign: 'center', marginTop: 16 },
  error: { color: 'red', marginBottom: 12 },
})
`
}
