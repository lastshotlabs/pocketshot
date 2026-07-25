import { useEffect, useMemo, useState } from 'react'
import {
  AppState,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { StatusBar } from 'expo-status-bar'
import QRCode from 'react-native-qrcode-svg'
import { BlankSlateController, type BlankSlateState } from '../lib/blankslate'

type AppSection = 'Play' | 'Games' | 'Library' | 'Build' | 'You'

export default function BlankSlateApp({ initialJoinCode }: { initialJoinCode?: string } = {}) {
  const controller = useMemo(
    () =>
      new BlankSlateController(undefined, {
        lockIn: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        matchedReveal: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
        rejectedInput: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
      }),
    [],
  )
  const [game, setGame] = useState<BlankSlateState>(controller.state)
  const [section, setSection] = useState<AppSection>('Play')
  const [contentRevision, setContentRevision] = useState(0)
  useEffect(() => controller.subscribe(setGame), [controller])
  useEffect(() => {
    if (initialJoinCode) controller.join(initialJoinCode)
  }, [controller, initialJoinCode])
  useEffect(
    () =>
      AppState.addEventListener('change', (next) =>
        controller.setLifecycle(
          next === 'active' ? 'active' : next === 'background' ? 'background' : 'suspended',
        ),
      ).remove,
    [controller],
  )
  const collections = controller.prompts.browse({
    scope: section === 'Library' ? 'all' : 'mine',
    viewerId: 'p1',
    sort: 'updated',
  }).items

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.brand}>
          BLANK SLATE
        </Text>
        <Text accessibilityLiveRegion="polite" style={styles.meta}>
          {game.connection === 'online' ? 'Connected' : game.connection}
        </Text>
        {game.notice && (
          <Text accessibilityRole="alert" style={styles.notice}>
            {game.notice}
          </Text>
        )}
        {game.phase === 'entry' && section === 'Play' && (
          <Card title="Match your friends">
            <View accessibilityLabel="QR join code SLATE-42" style={styles.qr}>
              <QRCode value="blankslate://join/SLATE-42" size={112} />
            </View>
            <Text style={styles.meta}>
              {game.preset} · {game.winMode} · {Math.round(game.writeMs / 1000)} second timer
            </Text>
            <Action
              testID="quickplay"
              label="Use quickplay setup"
              onPress={() => controller.applyPreset('quickplay')}
            />
            <Action
              testID="custom-setup"
              label="Configure custom fixed-round match"
              onPress={() =>
                controller.configureSetup({
                  fixedRounds: 7,
                  winMode: 'fixed-rounds',
                  writeMs: 40_000,
                  hostParticipates: false,
                })
              }
            />
            <Action
              testID="guest-entry"
              label="Continue as guest"
              onPress={() => controller.enter()}
            />
            <Action
              testID="apple-entry"
              label="Continue with Apple"
              onPress={() => void controller.signInOAuth('apple')}
            />
            <Action
              testID="google-entry"
              label="Continue with Google"
              onPress={() => void controller.signInOAuth('google')}
            />
            <Action
              testID="passkey-entry"
              label="Create and use passkey"
              onPress={() =>
                void controller.registerPasskey('ios').then(() => controller.signInPasskey())
              }
            />
          </Card>
        )}
        {game.phase === 'entry' && section === 'Games' && (
          <Card title="Your games">
            {controller.games.snapshot.records.map((record) => (
              <View key={record.id} style={styles.libraryRow}>
                <Text style={styles.copy}>{record.title}</Text>
                <Text style={styles.meta}>
                  {record.status} · {record.resumable ? 'resumable' : 'history'}
                </Text>
              </View>
            ))}
            <Action
              testID="games-refresh"
              label="Refresh games"
              onPress={() => controller.games.refresh(controller.games.snapshot.records)}
            />
          </Card>
        )}
        {game.phase === 'entry' && section === 'Library' && (
          <Card title="Prompt library">
            {collections.map((collection) => (
              <View key={collection.id} style={styles.libraryRow}>
                <Text style={styles.copy}>{collection.title}</Text>
                <Text style={styles.meta}>
                  {collection.items.length} cues · {collection.status}
                </Text>
              </View>
            ))}
          </Card>
        )}
        {game.phase === 'entry' && section === 'Build' && (
          <Card title="Build a prompt deck">
            <Text style={styles.copy}>
              Cue validation supports prefix, suffix, and infix blanks with review before publish.
            </Text>
            <Action
              testID="generate-prompt"
              label="Generate reviewed suggestion"
              onPress={() => {
                const id = `mobile-proposal-${contentRevision}`
                controller.proposePrompts(id, [`Road ___ ${contentRevision + 1}`], 'Mobile draft')
                controller.reviewPromptProposal(id, true)
                setContentRevision((value) => value + 1)
              }}
            />
            <Action
              testID="bulk-add-prompts"
              label="Paste three prompt cues"
              onPress={() =>
                controller.bulkAddPrompts('Summer ___\n___ station\nSuper ___ surprise')
              }
            />
            <Action
              testID="rename-prompt-deck"
              label="Rename and autosave deck"
              onPress={() => controller.renamePromptDeck('Weekend prompts')}
            />
            <Action
              testID="duplicate-prompt-deck"
              label="Duplicate prompt deck"
              onPress={() => controller.duplicatePromptDeck()}
            />
            {controller.prompts.snapshot.some(
              (collection) => collection.id === 'starter-copy' && collection.status !== 'archived',
            ) && (
              <Action
                testID="archive-prompt-deck"
                label="Delete duplicate deck"
                onPress={() => controller.archivePromptDeck()}
              />
            )}
            <Text style={styles.meta}>
              {controller.prompts.health('starter').itemCount} valid cues
            </Text>
          </Card>
        )}
        {game.phase === 'entry' && section === 'You' && (
          <Card title="You">
            <Text style={styles.copy}>
              {game.profile?.displayName ?? 'Alex'} · {game.identityStatus}
              {game.identityEmail ? ` · ${game.identityEmail}` : ''}
            </Text>
            <Text style={styles.meta}>
              {game.profile?.avatarUrl ? 'Profile image set' : 'No profile image'}
            </Text>
            <Action
              testID="edit-profile"
              label="Complete player profile"
              onPress={() =>
                controller.updateProfile('Alex Rivera', 'https://cdn.example.test/alex.jpg')
              }
            />
            <Text style={styles.meta}>Passkeys: {game.passkeyCount}</Text>
            <Text testID="personal-push-status" style={styles.meta}>
              Push: personal turns only · {game.roomMuted ? 'Room muted' : 'Room active'} ·{' '}
              {game.deliveredPushes.length} delivered
            </Text>
            <Action
              testID="toggle-room-mute"
              label={game.roomMuted ? 'Unmute room notifications' : 'Mute room notifications'}
              onPress={() => controller.setRoomMuted(!game.roomMuted)}
            />
            <Action
              testID="preview-turn-push"
              label="Preview personal turn notification"
              onPress={() =>
                controller.deliverPersonalPush(
                  'turn-to-write',
                  'p1',
                  `turn-preview-${game.deliveredPushes.length + 1}`,
                )
              }
            />
            <Action
              testID="enable-quiet-hours"
              label="Enable overnight quiet hours"
              onPress={() => controller.setQuietHours({ startHour: 22, endHour: 8 })}
            />
            <Action
              testID="account-settings"
              label="Account and privacy"
              onPress={() => undefined}
            />
            {game.passkeyCount > 0 && (
              <Action
                testID="remove-passkey"
                label="Remove passkey"
                onPress={() => void controller.removePasskey()}
              />
            )}
          </Card>
        )}
        {game.phase === 'lobby' && (
          <Card title="Lobby">
            <Text style={styles.copy}>{game.players.map((player) => player.name).join(' · ')}</Text>
            <Text style={styles.meta}>Waiting: {controller.admissionQueue().length}</Text>
            <Action
              testID="enable-admission"
              label="Require host approval"
              onPress={() => controller.setAdmissionPolicy('approval')}
            />
            <Action
              testID="request-spectator"
              label="Request TV spectator"
              onPress={() => controller.requestAdmission('tv', 'Living Room TV', 'spectator')}
            />
            {controller.admissionQueue().find((request) => request.status === 'pending') && (
              <Action
                testID="admit-request"
                label="Admit waiting guest"
                onPress={() =>
                  controller.decideAdmission(
                    controller.admissionQueue().find((request) => request.status === 'pending')!.id,
                    true,
                  )
                }
              />
            )}
            <Action
              testID="start-round"
              label="Start round"
              onPress={() => controller.startRound()}
            />
          </Card>
        )}
        {game.phase === 'write' && (
          <Card title={game.prompt}>
            <Text style={styles.copy}>
              {game.submittedIds.length}/{game.players.length} slates locked
            </Text>
            <Text style={styles.meta}>
              {Math.ceil(controller.remainingWriteMs() / 1000)} seconds · Alex:{' '}
              {game.submissionStates.p1?.status ?? 'draft'}
            </Text>
            <Text testID="offline-command-count" style={styles.meta}>
              Offline commands: {controller.pendingOfflineCommandCount}
            </Text>
            <Action
              testID="queue-alex-offline"
              label="Save Alex’s slate offline"
              onPress={() => void controller.queueAnswer('p1', 'cake', `offline-p1-${game.round}`)}
            />
            {controller.pendingOfflineCommandCount > 0 && (
              <Action
                testID="sync-offline-commands"
                label="Reconnect and sync"
                onPress={() => void controller.replayOfflineCommands()}
              />
            )}
            <TextInput
              testID="private-slate-input"
              accessibilityLabel="Your private slate"
              accessibilityHint="Your answer remains private until the host reveals all slates"
              value={game.draftAnswers.p1 ?? ''}
              onChangeText={(value) => controller.updateSlateDraft('p1', value)}
              placeholder="Write your answer"
              placeholderTextColor="#8fb5a5"
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              returnKeyType="done"
              maxLength={80}
              style={styles.slateInput}
            />
            <Action
              testID="submit-alex"
              label={game.submittedIds.includes('p1') ? 'Edit Alex’s slate' : 'Lock Alex’s slate'}
              onPress={() =>
                controller.submit(
                  'p1',
                  game.draftAnswers.p1 ?? '',
                  `p1-${game.round}-${Date.now()}`,
                )
              }
            />
            <Action
              testID="submit-sam"
              label="Sam writes cake"
              onPress={() => controller.submit('p2', 'cake', `p2-${game.round}`)}
            />
            {game.submissionStates.p1?.status === 'pending' && (
              <>
                <Action
                  testID="acknowledge-alex-slate"
                  label="Confirm Alex’s slate delivered"
                  onPress={() => controller.acknowledgeLatestSubmission('p1')}
                />
                <Action
                  testID="reject-alex-slate"
                  label="Simulate Alex send failure"
                  onPress={() => controller.rejectLatestSubmission('p1', 'Connection lost')}
                />
              </>
            )}
            {game.submissionStates.p1?.status === 'rejected' && (
              <Action
                testID="resend-alex-slate"
                label="Resend Alex’s slate"
                onPress={() =>
                  controller.resendLatestSubmission('p1', `p1-resend-${game.round}-${Date.now()}`)
                }
              />
            )}
            <Action
              testID="submit-jo"
              label="Jo writes party"
              onPress={() => controller.submit('p3', 'party', `p3-${game.round}`)}
            />
            <Action testID="reveal" label="Reveal slates" onPress={() => controller.reveal()} />
          </Card>
        )}
        {game.phase === 'reveal' && (
          <Card title="Reveal">
            {game.groups.map((group) => (
              <View key={group.id} style={styles.slate}>
                <Text style={styles.answer}>{group.answer}</Text>
                <Text style={styles.copy}>
                  {group.playerIds.length} player{group.playerIds.length === 1 ? '' : 's'}
                </Text>
              </View>
            ))}
            {game.groups.length >= 2 && (
              <Action
                testID="merge-groups"
                label="Merge first two groups"
                onPress={() => controller.merge([game.groups[0].id, game.groups[1].id])}
              />
            )}
            {game.groups.some((group) => group.playerIds.length > 1) && (
              <Action
                testID="split-group"
                label="Split first matched group"
                onPress={() =>
                  controller.split(game.groups.find((group) => group.playerIds.length > 1)!.id)
                }
              />
            )}
            <Action
              testID="undo-fix"
              label="Undo host fix"
              onPress={() => controller.undoCorrection()}
            />
            <Action
              testID="merge-vote"
              label="Open merge vote"
              onPress={() => controller.openMergeVote()}
            />
            <Action
              testID="score-round"
              label="Score round"
              onPress={() => controller.scoreRound()}
            />
          </Card>
        )}
        {game.phase === 'vote' && (
          <Card title="Merge vote">
            <Text style={styles.meta}>
              Offline commands: {controller.pendingOfflineCommandCount}
            </Text>
            <Action
              testID="queue-vote-offline"
              label="Save merge vote offline"
              onPress={() =>
                void controller.queueMergeVote(
                  'p1',
                  game.groups[0]?.id ?? '',
                  true,
                  `offline-vote-${game.round}`,
                )
              }
            />
            {controller.pendingOfflineCommandCount > 0 && (
              <Action
                testID="sync-vote-commands"
                label="Reconnect and sync votes"
                onPress={() => void controller.replayOfflineCommands()}
              />
            )}
            <Action
              testID="approve-merge"
              label="Approve first group"
              onPress={() => controller.vote('p1', game.groups[0]?.id ?? '', true)}
            />
            <Action testID="close-vote" label="Close vote" onPress={() => controller.closeVote()} />
          </Card>
        )}
        {(game.phase === 'summary' || game.phase === 'sudden-death') && (
          <Card title={game.phase === 'sudden-death' ? 'Sudden death' : 'Scoreboard'}>
            {game.players.map((player) => (
              <Text key={player.id} style={styles.copy}>
                {player.name} · {player.score}
              </Text>
            ))}
            <Action
              testID="next-round"
              label="Next round"
              onPress={() => controller.startRound()}
            />
          </Card>
        )}
        {game.phase === 'results' && (
          <Card title="Winners">
            <Text style={styles.answer}>{game.winnerIds.join(', ')}</Text>
            <Action
              testID="share-results"
              label="Share results"
              onPress={() => void Share.share(controller.resultsSharePayload())}
            />
            <Action
              testID="rematch"
              label="Rematch"
              onPress={() => controller.rematch('native-rematch')}
            />
          </Card>
        )}
        {game.phase !== 'entry' && game.phase !== 'results' && (
          <Card title="Host booth">
            <Text style={styles.meta}>
              {game.paused ? 'Match paused' : 'Match live'} · {game.blockedPlayerIds.length} blocked
            </Text>
            <Action
              testID="pause-resume"
              label={game.paused ? 'Resume match' : 'Pause match'}
              onPress={() => (game.paused ? controller.resume() : controller.pause())}
            />
            <Action
              testID="stage-rules"
              label="Stage fixed-round rules"
              onPress={() => controller.stageWinRules({ winMode: 'fixed-rounds', fixedRounds: 5 })}
            />
            <Action
              testID="recover-host"
              label="Recover host"
              onPress={() => controller.recoverHost()}
            />
            <Action
              testID="handoff-seat"
              label="Hand seat to Sam"
              onPress={() => controller.handoffSeat('p1', 'p2')}
            />
            {controller.activityProjection().at(-1) && (
              <Action
                testID="react-activity"
                label="React to activity"
                onPress={() => controller.reactToLatest('p1', '👏')}
              />
            )}
            {!game.endConfirmationPending ? (
              <Action
                testID="request-end"
                label="End match"
                onPress={() => controller.requestEndMatch()}
              />
            ) : (
              <>
                <Text accessibilityRole="alert" style={styles.notice}>
                  End this match for everyone?
                </Text>
                <Action
                  testID="confirm-end"
                  label="Confirm end match"
                  onPress={() => controller.confirmEndMatch()}
                />
                <Action
                  testID="cancel-end"
                  label="Keep playing"
                  onPress={() => controller.cancelEndMatch()}
                />
              </>
            )}
          </Card>
        )}
      </ScrollView>
      {game.phase === 'entry' && (
        <View accessibilityRole="tablist" style={styles.tabs}>
          {(['Play', 'Games', 'Library', 'Build', 'You'] as const).map((tab) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: section === tab }}
              accessibilityLabel={tab}
              testID={`tab-${tab.toLocaleLowerCase()}`}
              key={tab}
              onPress={() => setSection(tab)}
              style={[styles.tab, section === tab && styles.selectedTab]}
            >
              <Text style={styles.tabText}>{tab}</Text>
            </Pressable>
          ))}
        </View>
      )}
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
      style={styles.button}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  )
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#10251e' },
  content: { padding: 24, paddingBottom: 92, gap: 18 },
  brand: { color: '#f5e7c6', fontSize: 33, fontWeight: '900', letterSpacing: 2 },
  card: {
    backgroundColor: '#19382e',
    borderColor: '#376c59',
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    gap: 14,
  },
  heading: { color: '#fff8e8', fontSize: 25, fontWeight: '800' },
  copy: { color: '#c8dfd5', fontSize: 17 },
  meta: { color: '#8fb5a5', fontSize: 14 },
  libraryRow: { borderBottomColor: '#376c59', borderBottomWidth: 1, paddingVertical: 10, gap: 4 },
  qr: { alignSelf: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 12 },
  notice: { color: '#fff', backgroundColor: '#8b1e1e', padding: 12, borderRadius: 10 },
  slate: { backgroundColor: '#f5e7c6', borderRadius: 10, padding: 14 },
  slateInput: {
    minHeight: 52,
    borderColor: '#8fb5a5',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#fff8e8',
    fontSize: 18,
  },
  answer: { color: '#10251e', fontSize: 28, fontWeight: '900' },
  button: {
    minHeight: 48,
    backgroundColor: '#d99d3f',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  buttonText: { color: '#1d261f', fontSize: 17, fontWeight: '900' },
  tabs: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 66,
    backgroundColor: '#0a1914',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    minWidth: 56,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  selectedTab: { borderTopColor: '#d99d3f', borderTopWidth: 3 },
  tabText: { color: '#f5e7c6', fontSize: 13, fontWeight: '700' },
})
