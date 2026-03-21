export function communityThreadTemplate(): string {
  return `import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useGetThread, useListReplies, useCreateReply } from '@/lib/pocketshot'
import type { ReplyResponse } from '@lastshotlabs/pocketshot'

export default function CommunityThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>()
  const [body, setBody] = useState('')

  const { data: thread, isLoading: threadLoading } = useGetThread(threadId ?? '')
  const { data: replies, isLoading: repliesLoading } = useListReplies({ threadId: threadId ?? '' })
  const { mutate: createReply, isPending } = useCreateReply()

  function handleSubmit() {
    if (!body.trim() || !threadId) return
    createReply({ threadId, body: body.trim() }, {
      onSuccess: () => setBody(''),
    })
  }

  if (threadLoading || repliesLoading) return <ActivityIndicator style={{ flex: 1 }} />

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {thread && (
        <View style={styles.thread}>
          <Text style={styles.title}>{thread.title}</Text>
          <Text style={styles.body}>{thread.body}</Text>
          <Text style={styles.meta}>{new Date(thread.createdAt).toLocaleDateString()}</Text>
        </View>
      )}
      <FlatList
        data={replies?.items ?? []}
        keyExtractor={(r) => r.id}
        renderItem={({ item }: { item: ReplyResponse }) => (
          <View style={styles.reply}>
            <Text style={styles.replyBody}>{item.body}</Text>
            <Text style={styles.replyMeta}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No replies yet.</Text>}
        style={styles.list}
      />
      <View style={styles.compose}>
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder="Write a reply…"
          multiline
        />
        <TouchableOpacity style={styles.send} onPress={handleSubmit} disabled={isPending || !body.trim()}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  thread: { padding: 24, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  body: { fontSize: 15, color: '#333', lineHeight: 22 },
  meta: { fontSize: 12, color: '#999', marginTop: 8 },
  list: { flex: 1 },
  reply: { padding: 16, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  replyBody: { fontSize: 14, color: '#333' },
  replyMeta: { fontSize: 11, color: '#aaa', marginTop: 4 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 32 },
  compose: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderColor: '#eee', alignItems: 'flex-end' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, maxHeight: 100 },
  send: { marginLeft: 8, backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  sendText: { color: '#fff', fontWeight: '600' },
})
`
}
