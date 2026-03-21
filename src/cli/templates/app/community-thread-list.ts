export function communityThreadListTemplate(): string {
  return `import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useListThreads } from '@/lib/pocketshot'
import type { ThreadResponse } from '@lastshotlabs/pocketshot'

export default function CommunityThreadListScreen() {
  const router = useRouter()
  const { containerId } = useLocalSearchParams<{ containerId: string }>()
  const { data, isLoading } = useListThreads({ containerId: containerId ?? '' })

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(t) => t.id}
        renderItem={({ item }: { item: ThreadResponse }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push(\`/(app)/community/threads/\${item.id}\` as never)}
          >
            {item.isPinned ? <Text style={styles.pinned}>Pinned</Text> : null}
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              {item.replyCount} {item.replyCount === 1 ? 'reply' : 'replies'} · {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No threads yet. Start the conversation!</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  item: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  pinned: { fontSize: 11, color: '#f59e0b', fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 12, color: '#888', marginTop: 4 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 48 },
})
`
}
