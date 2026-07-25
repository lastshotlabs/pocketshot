import { useEffect, useMemo, useState } from 'react'
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as SQLite from 'expo-sqlite'
import { createSQLiteDraftStorage } from '@lastshotlabs/pocketshot/drafts'
import { CommunityDemoController, type CommunityState, type CommunityView } from '../lib/community'

export default function CommunityShell() {
  const community = useMemo(
    () => new CommunityDemoController(createSQLiteDraftStorage('community-shell.db', SQLite)),
    [],
  )
  const [state, setState] = useState<CommunityState>(community.state)
  useEffect(() => community.subscribe(setState), [community])
  useEffect(() => {
    void community.restoreAccount()
  }, [community])
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
          <Text style={styles.copy}>
            Account: {state.accountStatus}
            {state.accountEmail ? ` · ${state.accountEmail}` : ''}
          </Text>
          <Action
            testID="complete-onboarding"
            label="Continue as @alex"
            onPress={() => community.completeOnboarding('alex')}
          />
          {state.accountStatus === 'anonymous' && (
            <>
              <Action
                testID="register-account"
                label="Register account"
                onPress={() => void community.registerAccount()}
              />
              <Action
                testID="oauth-account"
                label="Continue with Apple"
                onPress={() => void community.signInOAuth('apple')}
              />
            </>
          )}
          {state.accountStatus === 'verification-required' && (
            <Action
              testID="verify-account"
              label="Verify email"
              onPress={() => void community.verifyAccount()}
            />
          )}
        </View>
      )}
      <View style={styles.tabs}>
        {(
          ['feed', 'compose', 'notifications', 'messages', 'profile', 'privacy'] as CommunityView[]
        ).map((view) => (
          <Pressable
            key={view}
            testID={`tab-${view}`}
            accessibilityRole="tab"
            accessibilityLabel={`${view} tab`}
            accessibilityState={{ selected: state.view === view }}
            onPress={() => community.navigate(view)}
            style={styles.tab}
          >
            <Text style={styles.tabText}>{view}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {state.view === 'feed' && (
          <Card title="Trail Talk">
            {state.threads.map((thread, index) => (
              <Pressable
                key={thread.id}
                testID={index === 0 ? 'feed-first-thread' : `thread-${thread.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Open ${thread.title}`}
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
            <Action
              testID="search-community"
              label="Search threads, replies, people, and communities"
              onPress={() => community.search('trail')}
            />
            {state.searchResults.map((result) => (
              <Text key={result} style={styles.copy}>
                Search result · {result}
              </Text>
            ))}
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
                <View
                  key={reply.id}
                  style={[styles.replyBlock, reply.parentId ? styles.nestedReply : undefined]}
                >
                  <Text style={styles.reply}>
                    {reply.deleted ? 'Deleted reply' : `${reply.author}: ${reply.body}`} ·{' '}
                    {reply.reactions} reactions
                  </Text>
                  {!reply.deleted && (
                    <>
                      <Action
                        testID={`nested-reply-${reply.id}`}
                        label={`Reply to ${reply.author}`}
                        onPress={() => community.reply('Nested follow-up', reply.id)}
                      />
                      <Action
                        testID={`edit-reply-${reply.id}`}
                        label="Edit reply"
                        onPress={() => community.editReply(reply.id, 'Edited reply')}
                      />
                      <Action
                        testID={`react-reply-${reply.id}`}
                        label="React to reply"
                        onPress={() => community.reactToReply(reply.id)}
                      />
                      <Action
                        testID={`delete-reply-${reply.id}`}
                        label="Delete reply"
                        onPress={() => community.deleteReply(reply.id)}
                      />
                    </>
                  )}
                </View>
              ))}
            <Action
              testID="reply"
              label="Reply"
              onPress={() => community.reply('Try River Loop.')}
            />
            <Action testID="react" label="React" onPress={() => community.react(selected.id)} />
            <Action
              testID="save-thread"
              label={
                state.savedThreadIds.includes(selected.id) ? 'Remove saved thread' : 'Save thread'
              }
              onPress={() =>
                community.setSaved(selected.id, !state.savedThreadIds.includes(selected.id))
              }
            />
            <Action
              testID="edit-thread"
              label="Edit thread"
              onPress={() => community.editSelectedThread('Edited trail question', selected.body)}
            />
            {selected.author === 'Alex' && (
              <Action
                testID="delete-thread"
                label="Delete thread"
                onPress={() => community.deleteSelectedThread()}
              />
            )}
            <Action
              testID="report"
              label="Report"
              onPress={() => community.report(selected.id, 'Needs review')}
            />
          </Card>
        )}
        {state.view === 'notifications' && (
          <Card title="Notifications">
            <Text style={styles.copy}>
              Reply alerts: {state.notificationPreferences.reply ? 'on' : 'off'} · Mention alerts:{' '}
              {state.notificationPreferences.mention ? 'on' : 'off'}
            </Text>
            {state.notifications.map((item) => (
              <Text key={item.id} style={styles.copy}>
                {item.read ? 'Read' : 'New'} · {item.text}
              </Text>
            ))}
            <Action
              testID="toggle-reply-notifications"
              label={
                state.notificationPreferences.reply
                  ? 'Disable reply notifications'
                  : 'Enable reply notifications'
              }
              onPress={() =>
                community.setNotificationPreference('reply', !state.notificationPreferences.reply)
              }
            />
            <Action
              testID="open-notification-handoff"
              label="Open welcome thread from push"
              onPress={() => community.openPushHandoff('/threads/thread-welcome?source=push')}
            />
            <Action testID="read-all" label="Mark all read" onPress={() => community.readAll()} />
          </Card>
        )}
        {state.view === 'messages' && (
          <Card title="Messages">
            <Text style={styles.copy}>
              {state.presence} · {state.typing ? 'typing…' : 'not typing'}
            </Text>
            {state.messages.map((message) => (
              <View key={message.id} style={styles.replyBlock}>
                <Text style={styles.reply}>{message.body || 'Attachment'}</Text>
                {!!message.attachments?.length && (
                  <Text style={styles.copy}>{message.attachments.length} validated attachment</Text>
                )}
              </View>
            ))}
            {state.rooms.map((room) => (
              <View key={room.id} style={styles.thread}>
                <Text style={styles.copy}>
                  {room.name} · {room.memberIds.length} members · {room.unread} unread
                </Text>
                <Action
                  testID={`open-room-${room.id}`}
                  label={`Open ${room.name}`}
                  onPress={() => community.openRoom(room.id)}
                />
              </View>
            ))}
            <Action
              testID="create-room"
              label="Create Ridge Crew room"
              onPress={() => community.createRoom('ridge-crew', 'Ridge Crew', ['alex', 'morgan'])}
            />
            <Action
              testID="receive-room-message"
              label="Receive Trail Room message"
              onPress={() => community.receiveRoomMessage('trail-room', Date.now())}
            />
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
              testID="send-message-attachment"
              label="Send validated photo"
              onPress={() =>
                community.sendMessage('', [
                  {
                    id: 'trail-photo',
                    url: 'https://cdn.example.test/trail.jpg',
                    mediaType: 'image/jpeg',
                  },
                ])
              }
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
            <Text style={styles.copy}>Admin audit events: {state.adminAuditCount}</Text>
            <Text style={styles.copy}>Moderation audit events: {state.moderationAuditCount}</Text>
            <Text style={styles.copy}>
              Slow mode: {state.adminFlags['slow-mode'] ? 'enabled' : 'disabled'}
            </Text>
            {state.reports.map((report) => (
              <View key={report.id} style={styles.thread}>
                <Text style={styles.copy}>
                  {report.reason} · {report.status} · {report.assigneeId ?? 'unassigned'} ·{' '}
                  {report.noteCount ?? 0} notes
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
            <Action
              testID="toggle-admin-flag"
              label="Enable slow mode"
              onPress={() => community.setAdminFlag('slow-mode', true)}
            />
            <Action
              testID="publish-admin-broadcast"
              label="Publish safety broadcast"
              onPress={() => community.publishAdminBroadcast('Please review the community rules.')}
            />
            <Action
              testID="admin-ban-user"
              label="Ban reported account"
              onPress={() => community.banUser('reported-user', 'Repeated harassment')}
            />
          </Card>
        )}
        {state.view === 'profile' && (
          <Card title="Profile and relationships">
            <Text style={styles.copy}>
              @{state.profile?.handle ?? 'unset'} · {state.profile?.displayName ?? 'No profile'}
            </Text>
            <Text style={styles.copy}>
              {state.profile?.biography || 'No biography'} · {state.profile?.visibility ?? 'public'}
            </Text>
            <Text style={styles.copy}>
              Following: {state.followingUsers.length} · Muted: {state.mutedUsers.length}
            </Text>
            <Text style={styles.copy}>
              Account: {state.accountStatus}
              {state.accountEmail ? ` · ${state.accountEmail}` : ''}
            </Text>
            <Action
              testID="edit-profile"
              label="Complete profile"
              onPress={() =>
                community.updateProfile({
                  displayName: 'Alex Rivera',
                  biography: 'Trail runner and community host',
                  avatarUrl: 'https://cdn.example.test/alex.jpg',
                  visibility: 'followers',
                })
              }
            />
            <Action
              testID="follow-user"
              label={state.followingUsers.includes('morgan') ? 'Unfollow Morgan' : 'Follow Morgan'}
              onPress={() =>
                state.followingUsers.includes('morgan')
                  ? community.unfollow('morgan')
                  : community.follow('morgan')
              }
            />
            <Action
              testID="mute-user"
              label={state.mutedUsers.includes('morgan') ? 'Unmute Morgan' : 'Mute Morgan'}
              onPress={() =>
                state.mutedUsers.includes('morgan')
                  ? community.unmute('morgan')
                  : community.mute('morgan')
              }
            />
            {state.accountStatus === 'authenticated' && (
              <Action
                testID="sign-out-account"
                label="Sign out"
                onPress={() => void community.signOutAccount()}
              />
            )}
          </Card>
        )}
        {state.view === 'privacy' && (
          <Card title="Privacy">
            <Text style={styles.copy}>Blocked: {state.blockedUsers.length}</Text>
            <Text style={styles.copy}>Export: {state.exportStatus}</Text>
            <Text style={styles.copy}>Deletion: {state.deletionStatus}</Text>
            <Text style={styles.copy}>
              Local cleanup: {state.localDataCleared ? 'complete' : 'not started'}
            </Text>
            <Action
              testID="block-user"
              label="Block Morgan"
              onPress={() => community.block('morgan')}
            />
            <Action
              testID="privacy-export"
              label="Request export"
              onPress={() => void community.requestExport()}
            />
            {state.exportStatus === 'requested' && (
              <Action
                testID="refresh-export"
                label="Refresh export"
                onPress={() => void community.refreshExport()}
              />
            )}
            {state.deletionStatus !== 'scheduled' && state.deletionStatus !== 'completed' && (
              <Action
                testID="request-deletion"
                label="Schedule account deletion"
                onPress={() => void community.requestDeletion()}
              />
            )}
            {state.deletionStatus === 'scheduled' && (
              <>
                <Action
                  testID="cancel-deletion"
                  label="Cancel account deletion"
                  onPress={() => void community.cancelDeletion()}
                />
                <Action
                  testID="complete-deletion"
                  label="Confirm server deletion"
                  onPress={() => void community.completeDeletion()}
                />
              </>
            )}
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
    minHeight: 44,
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
  thread: {
    minHeight: 44,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    gap: 6,
  },
  reply: { padding: 10, borderLeftWidth: 3, borderLeftColor: '#22c55e', color: '#374151' },
  replyBlock: { gap: 8 },
  nestedReply: { marginLeft: 20 },
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
