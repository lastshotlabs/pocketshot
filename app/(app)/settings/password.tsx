import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useSetPassword } from '@/lib/pocketshot'

export default function ChangePasswordScreen() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const router = useRouter()
  const { mutate, isPending, isSuccess, error } = useSetPassword()

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Password updated</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change password</Text>
      <TextInput style={styles.input} placeholder="Current password" value={current} onChangeText={setCurrent} secureTextEntry />
      <TextInput style={styles.input} placeholder="New password" value={next} onChangeText={setNext} secureTextEntry />
      <TextInput style={styles.input} placeholder="Confirm new password" value={confirm} onChangeText={setConfirm} secureTextEntry />
      {next !== confirm && confirm.length > 0 && <Text style={styles.error}>Passwords do not match</Text>}
      {error && <Text style={styles.error}>{(error as Error).message}</Text>}
      <TouchableOpacity
        style={styles.button}
        onPress={() => mutate({ currentPassword: current, newPassword: next })}
        disabled={isPending || next !== confirm}
      >
        {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update password</Text>}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#007AFF', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { color: '#007AFF', marginTop: 16 },
  error: { color: 'red', marginBottom: 12 },
})
