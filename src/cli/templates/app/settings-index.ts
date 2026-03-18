export function settingsIndexTemplate(): string {
  return `import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'

export default function SettingsScreen() {
  const router = useRouter()
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <TouchableOpacity style={styles.item} onPress={() => router.push('/(app)/settings/password')}>
        <Text style={styles.itemText}>Change password</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => router.push('/(app)/settings/sessions')}>
        <Text style={styles.itemText}>Active sessions</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => router.push('/(app)/settings/email-otp')}>
        <Text style={styles.itemText}>Two-factor authentication</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.item, styles.danger]} onPress={() => router.push('/(app)/settings/delete-account')}>
        <Text style={[styles.itemText, styles.dangerText]}>Delete account</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  item: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  itemText: { fontSize: 16 },
  danger: { marginTop: 24 },
  dangerText: { color: 'red' },
})
`
}
