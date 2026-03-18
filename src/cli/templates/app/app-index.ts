import type { PocketshotScaffoldConfig } from '../../types'

export function appIndexTemplate(config: PocketshotScaffoldConfig): string {
  const settingsButton = config.authScreens
    ? `      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push('/(app)/settings/')}
      >
        <Text style={styles.settingsText}>Settings</Text>
      </TouchableOpacity>`
    : ''

  const settingsStyle = config.authScreens
    ? `  settingsButton: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, paddingHorizontal: 24 },
  settingsText: { fontSize: 16, color: '#007AFF' },`
    : ''

  return `import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useLogout } from '@/lib/pocketshot'

export default function HomeScreen() {
  const { mutate: logout } = useLogout()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>pocketshot</Text>
      <Text style={styles.subtitle}>You're signed in.</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => logout(undefined, { onSuccess: () => router.replace('/(auth)/login') })}
      >
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
${settingsButton}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  title: { fontSize: 32, fontWeight: '700' },
  subtitle: { color: '#666' },
  button: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, paddingHorizontal: 24 },
  buttonText: { fontSize: 16 },
${settingsStyle}
})
`
}
