import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { useSessions, useRevokeSession } from '@/lib/pocketshot'
import type { SessionInfo } from '@lastshotlabs/pocketshot'

export default function SessionsScreen() {
  const { data: sessions, isLoading } = useSessions()
  const { mutate: revoke, isPending } = useRevokeSession()

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active sessions</Text>
      <FlatList
        data={sessions ?? []}
        keyExtractor={(s) => s.sessionId}
        renderItem={({ item }: { item: SessionInfo }) => (
          <View style={styles.item}>
            <Text style={styles.ua}>{item.userAgent ?? 'Unknown device'}</Text>
            <Text style={styles.meta}>{item.ip ?? ''} · {item.lastActiveAt ? new Date(item.lastActiveAt).toLocaleDateString() : ''}</Text>
            <TouchableOpacity onPress={() => revoke({ sessionId: item.sessionId })} disabled={isPending}>
              <Text style={styles.revoke}>Revoke</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  item: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  ua: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 12, color: '#888', marginTop: 4 },
  revoke: { color: 'red', marginTop: 8 },
})
