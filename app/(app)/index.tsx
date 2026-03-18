import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { logout } from '@/lib/auth'

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>pocketshot</Text>
      <Text style={styles.subtitle}>You're signed in.</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => logout().then(() => router.replace('/(auth)/login'))}
      >
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  title: { fontSize: 32, fontWeight: '700' },
  subtitle: { color: '#666' },
  button: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, paddingHorizontal: 24 },
  buttonText: { fontSize: 16 },
})
