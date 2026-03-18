export function settingsDeleteAccountTemplate(): string {
  return `import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useDeleteAccount } from '@/lib/pocketshot'

export default function DeleteAccountScreen() {
  const router = useRouter()
  const { mutate, isPending, error } = useDeleteAccount()

  const handleDelete = () => {
    Alert.alert('Delete account', 'This cannot be undone. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => mutate(undefined, {
          onSuccess: () => router.replace('/(auth)/login'),
        }),
      },
    ])
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delete account</Text>
      <Text style={styles.warning}>This will permanently delete your account and all associated data.</Text>
      {error && <Text style={styles.error}>{(error as Error).message}</Text>}
      <TouchableOpacity style={[styles.button, styles.danger]} onPress={handleDelete} disabled={isPending}>
        {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Delete my account</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Cancel</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  warning: { color: '#555', marginBottom: 24 },
  button: { borderRadius: 8, padding: 14, alignItems: 'center' },
  danger: { backgroundColor: 'red' },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { color: '#007AFF', textAlign: 'center', marginTop: 16 },
  error: { color: 'red', marginBottom: 12 },
})
`
}
