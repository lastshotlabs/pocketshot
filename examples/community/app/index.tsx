import { useEffect, useMemo, useState } from 'react'
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { createSQLiteDraftStorage } from '@lastshotlabs/pocketshot/drafts'
import { CommunityDemoController, type CommunityState, type CommunityView } from '../lib/community'

export default function CommunityShell() {
  const community = useMemo(
    () => new CommunityDemoController(createSQLiteDraftStorage('community-shell.db')),
    [],
  )
  const [state, setState] = useState<CommunityState>(community.state)
  useEffect(() => community.subscribe(setState), [community])
  const selected = state.threads.find((thread) => thread.id === state.selectedThreadId)

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <Text accessibilityRole="header" style={styles.title}>
        PocketShot Community
      </Text>
      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {state.connection === 'online' ? 'Connected' : 'Reconnecting…'} · {state.unread} unread
      </Text>
      {state.notice && (
        <Text accessibilityRole="alert" style={styles.notice}>
          {state.notice}
        </Text>
      )}
      {!state.onboarded && (
        <View style={styles.onboarding}>
          <Text style={styles.copy}>Choose a community identity to participate.</Text>
          <Action
            testID="complete-onboarding"
            label="Continue as @alex"
            onPress={() => community.completeOnboarding('alex')}
          />
        </View>
      )}
      <View style={styles.tabs}>
        {(['feed', 'compose', 'notifications', 'messages', 'privacy'] as CommunityView[]).map(
          (view) => (
            <Pressable
              key={view}
              accessibilityRole="tab"
              accessibilityState={{ selected: state.view === view }}
              onPress={() => community.navigate(view)}
              style={styles.tab}
            >
              <Text style={styles.tabText}>{view}</Text>
            </Pressable>
          ),
        )}
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {state.view === 'feed' && (
          <Card title="Trail Talk">
            {state.threads.map((thread) => (
              <Pressable
                key={thread.id}
                accessibilityRole="button"
                onPress={() => community.openThread(thread.id)}
                style={styles.thread}
              >
                <Text style={styles.heading}>{thread.title}</Text>
                <Text style={styles.copy}>
                  {thread.author} · {thread.replyCount} replies · {thread.reactions} reactions
                </Text>
              </Pressable>
            ))}
            <Action
              testID="reconnect"
              label="Test reconnect"
              onPress={() => community.reconnect()}
            />
          </Card>
        )}
        {state.view === 'compose' && (
          <Card title="Durable compose">
            <Text style={styles.copy}>Draft: {state.draftTitle || 'empty'}</Text>
            <Action
              testID="write-draft"
              label="Write trail question"
              onPress={() =>
                void community.updateDraft('Best rainy-day trail?', 'Looking for local ideas.')
              }
            />
            <Action
              testID="publish-thread"
              label="Publish rich thread"
              onPress={() =>
                void community.publishDraft().then(() =>
                  community.enrichLatestThread({
                    attachments: ['photo.jpg'],
                    mentions: ['morgan'],
                    pollOptions: ['River Loop', 'Hill Track'],
                  }),
                )
              }
            />
          </Card>
        )}
        {state.view === 'thread' && selected && (
          <Card title={selected.title}>
            <Text style={styles.copy}>{selected.body}</Text>
            <Text style={styles.copy}>
              Attachments: {selected.attachments.length} · Mentions: {selected.mentions.length}
            </Text>
            {selected.poll?.options.map((option) => (
              <Action
                key={option.id}
                testID={`poll-${option.id}`}
                label={`${option.label}: ${option.votes}`}
                onPress={() => community.vote(selected.id, option.id)}
              />
            ))}
            {state.replies
              .filter((reply) => reply.threadId === selected.id)
              .map((reply) => (
                <Text key={reply.id} style={styles.reply}>
                  {reply.author}: {reply.body}
                </Text>
              ))}
            <Action
              testID="reply"
              label="Reply"
              onPress={() => community.reply('Try River Loop.')}
            />
            <Action testID="react" label="React" onPress={() => community.react(selected.id)} />
            <Action
              testID="report"
              label="Report"
              onPress={() => community.report(selected.id, 'Needs review')}
            />
          </Card>
        )}
        {state.view === 'notifications' && (
          <Card title="Notifications">
            {state.notifications.map((item) => (
              <Text key={item.id} style={styles.copy}>
                {item.read ? 'Read' : 'New'} · {item.text}
              </Text>
            ))}
            <Action testID="read-all" label="Mark all read" onPress={() => community.readAll()} />
          </Card>
        )}
        {state.view === 'messages' && (
          <Card title="Messages">
            <Text style={styles.copy}>
              {state.presence} · {state.typing ? 'typing…' : 'not typing'}
            </Text>
            {state.messages.map((message) => (
              <Text key={message.id} style={styles.reply}>
                {message.body}
              </Text>
            ))}
            <Action
              testID="typing"
              label="Simulate typing"
              onPress={() => community.setTyping(true)}
            />
            <Action
              testID="read-messages"
              label="Mark messages read"
              onPress={() => community.markMessagesRead()}
            />
            <Action
              testID="send-message"
              label="Send hello"
              onPress={() => community.sendMessage('Hello!')}
            />
            <Action
              testID="revoke-access"
              label="Simulate revoked access"
              onPress={() => community.revokeMessageAccess()}
            />
          </Card>
        )}
        {state.view === 'moderation' && (
          <Card title="Moderator queue">
            {state.reports.map((report) => (
              <View key={report.id} style={styles.thread}>
                <Text style={styles.copy}>
                  {report.reason} · {report.status}
                </Text>
                {report.status === 'open' && (
                  <Action
                    testID="resolve-report"
                    label="Resolve with warning"
                    onPress={() => community.resolveReport(report.id, 'warn')}
                  />
                )}
              </View>
            ))}
          </Card>
        )}
        {state.view === 'privacy' && (
          <Card title="Privacy">
            <Text style={styles.copy}>Blocked: {state.blockedUsers.length}</Text>
            <Text style={styles.copy}>Export: {state.exportStatus}</Text>
            <Action
              testID="block-user"
              label="Block Morgan"
              onPress={() => community.block('morgan')}
            />
            <Action
              testID="privacy-export"
              label="Request export"
              onPress={() => community.requestExport()}
            />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>
        {title}
      </Text>
      {children}
    </View>
  )
}

function Action({
  testID,
  label,
  onPress,
}: {
  testID: string
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.button}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f0fdf4', paddingTop: 18 },
  title: { color: '#14532d', fontSize: 29, fontWeight: '900', paddingHorizontal: 20 },
  status: { color: '#166534', paddingHorizontal: 20, paddingTop: 6, fontWeight: '700' },
  notice: {
    margin: 16,
    padding: 12,
    borderRadius: 10,
    color: '#7f1d1d',
    backgroundColor: '#fee2e2',
  },
  onboarding: { margin: 16, padding: 16, borderRadius: 14, backgroundColor: '#fff', gap: 10 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', padding: 14, gap: 8 },
  tab: {
    backgroundColor: '#dcfce7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabText: { color: '#14532d', fontWeight: '700', textTransform: 'capitalize' },
  content: { padding: 18, paddingBottom: 48 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, gap: 12 },
  heading: { color: '#14532d', fontSize: 20, fontWeight: '800' },
  copy: { color: '#374151', fontSize: 15, lineHeight: 22 },
  thread: { padding: 12, borderRadius: 12, backgroundColor: '#f0fdf4', gap: 6 },
  reply: { padding: 10, borderLeftWidth: 3, borderLeftColor: '#22c55e', color: '#374151' },
  button: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#15803d',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  buttonText: { color: '#fff', fontWeight: '800' },
})
