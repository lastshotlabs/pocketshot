export function communityContainersTemplate(): string {
  return `import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useListContainers } from '@/lib/pocketshot'
import type { ContainerResponse } from '@lastshotlabs/pocketshot'

export default function CommunityContainersScreen() {
  const router = useRouter()
  const { data, isLoading } = useListContainers()

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Community</Text>
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(c) => c.id}
        renderItem={({ item }: { item: ContainerResponse }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push(\`/(app)/community/\${item.id}/threads\` as never)}
          >
            <Text style={styles.name}>{item.name}</Text>
            {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
            {item.isClosed ? <Text style={styles.badge}>Closed</Text> : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No communities yet.</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  item: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  name: { fontSize: 16, fontWeight: '600' },
  desc: { fontSize: 13, color: '#666', marginTop: 4 },
  badge: { fontSize: 11, color: '#999', marginTop: 4 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 48 },
})
`
}
