import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useResetPassword } from '@/lib/pocketshot'

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const router = useRouter()
  const { mutate, isPending, isSuccess, error } = useResetPassword()

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Password updated</Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.link}>Back to login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const handleSubmit = () => {
    if (password !== confirm) return
    mutate({ token: token ?? '', password })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset password</Text>
      <TextInput
        style={styles.input}
        placeholder="New password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
      />
      {password !== confirm && confirm.length > 0 && (
        <Text style={styles.error}>Passwords do not match</Text>
      )}
      {error && <Text style={styles.error}>{(error as Error).message}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isPending || password !== confirm}>
        {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset password</Text>}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#007AFF', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { color: '#007AFF', textAlign: 'center', marginTop: 16 },
  error: { color: 'red', marginBottom: 12 },
})
