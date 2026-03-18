import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useUser, useLogout } from '@/lib/auth'

export default function HomeScreen() {
  const { user } = useUser()
  const logout = useLogout()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>pocketshot</Text>
      <Text style={styles.subtitle}>You're signed in{user?.email ? ` as ${user.email}` : ''}.</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => logout.mutate()}
        disabled={logout.isPending}
      >
        <Text style={styles.buttonText}>{logout.isPending ? 'Signing out…' : 'Sign Out'}</Text>
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
