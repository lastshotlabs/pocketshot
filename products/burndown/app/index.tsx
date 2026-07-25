import { useMemo, useState, useEffect } from 'react'
import { Pressable, SafeAreaView, ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useKeepAwake } from 'expo-keep-awake'
import QRCode from 'react-native-qrcode-svg'
import { BurndownController, type BurndownState } from '../lib/burndown'

export default function BurndownApp({ initialJoinCode }: { initialJoinCode?: string } = {}) {
  const controller = useMemo(() => new BurndownController(), [])
  const [game, setGame] = useState<BurndownState>(controller.state)
  const [section, setSection] = useState<'play' | 'games' | 'library' | 'build'>('play')
  const [contentRevision, setContentRevision] = useState(0)
  useEffect(() => controller.subscribe(setGame), [controller])
  useEffect(() => {
    if (initialJoinCode) controller.join(initialJoinCode)
  }, [controller, initialJoinCode])

  return (
    <SafeAreaView style={styles.screen}>
      {controller.sharedState.wakeLock && <ActiveTableWakeLock />}
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.brand}>
          BURNDOWN
        </Text>
        {game.phase === 'entry' && (
          <View accessibilityRole="tablist" style={styles.sections}>
            {(['play', 'games', 'library', 'build'] as const).map((item) => (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: section === item }}
                accessibilityLabel={item}
                testID={`section-${item}`}
                key={item}
                style={[styles.section, section === item && styles.selectedSection]}
                onPress={() => setSection(item)}
              >
                <Text style={styles.sectionText}>{item.toLocaleUpperCase()}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {game.notice && (
          <Text accessibilityRole="alert" style={styles.notice}>
            {game.notice}
          </Text>
        )}
        {game.phase === 'entry' && section === 'play' && (
          <Card title="Choose how to play">
            <Text style={styles.meta}>
              Identity: {game.identityStatus}
              {game.identityEmail ? ` · ${game.identityEmail}` : ''}
              {` · ${game.passkeyCount} passkeys`}
            </Text>
            <View accessibilityLabel={`QR join code ${game.joinCode}`} style={styles.qr}>
              <QRCode value={`burndown://join/${game.joinCode}`} size={112} />
            </View>
            <Action
              testID="enter-phones"
              label="Everyone has a phone"
              onPress={() => controller.enter('phones')}
            />
            <Action
              testID="enter-shared"
              label="Share this device"
              onPress={() => controller.enter('shared')}
            />
            <Action
              testID="account-entry"
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
        {game.phase === 'entry' && section === 'library' && (
          <Card title="Category library">
            {controller.categories.browse({ sort: 'title' }).items.map((collection) => (
              <View key={collection.id} style={styles.libraryRow}>
                <Text style={styles.copy}>{collection.title}</Text>
                <Text style={styles.meta}>
                  {collection.items.length} categories · {collection.status}
                </Text>
              </View>
            ))}
          </Card>
        )}
        {game.phase === 'entry' && section === 'games' && (
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
        {game.phase === 'entry' && section === 'build' && (
          <Card title="Build categories">
            <Text style={styles.copy}>
              Add, search, deduplicate, review, and publish custom category decks.
            </Text>
            <Action
              testID="generate-category"
              label="Generate reviewed category"
              onPress={() => {
                const id = `mobile-category-${contentRevision}`
                controller.proposeCategories(
                  id,
                  [`Things on vacation ${contentRevision + 1}`],
                  'Mobile draft',
                )
                controller.reviewCategoryProposal(id, true)
                setContentRevision((value) => value + 1)
              }}
            />
            <Text style={styles.meta}>
              {controller.categories.health('starter').itemCount} valid categories
            </Text>
          </Card>
        )}
        {game.phase === 'lobby' && (
          <Card title={`Lobby · ${game.joinCode}`} titleTestID="burndown-lobby-title">
            {game.players.map((player) => (
              <Text style={styles.copy} key={player.id}>
                {player.name} · {player.lives} lives
              </Text>
            ))}
            <Text style={styles.meta}>Waiting: {controller.admissionQueue().length}</Text>
            <Action
              testID="enable-admission"
              label="Require host approval"
              onPress={() => controller.setAdmissionPolicy('approval')}
            />
            <Action
              testID="request-tv"
              label="Request spectator TV"
              onPress={() => controller.requestAdmission('tv', 'Living Room TV', 'spectator')}
            />
            {controller.admissionQueue().some((request) => request.status === 'pending') && (
              <Action
                testID="admit-tv"
                label="Admit waiting spectator"
                onPress={() =>
                  controller.decideAdmission(
                    controller.admissionQueue().find((request) => request.status === 'pending')!.id,
                    true,
                  )
                }
              />
            )}
            <Action testID="start-match" label="Start match" onPress={() => controller.start()} />
          </Card>
        )}
        {game.phase === 'handoff' && (
          <Card title={`Pass to ${game.players.find((p) => p.id === game.activePlayerId)?.name}`}>
            <Text style={styles.copy}>Answers stay hidden until the active player is ready.</Text>
            <Action
              testID="arm-seat"
              label="I’m ready"
              onPress={() => controller.revealHandoff()}
            />
          </Card>
        )}
        {game.phase === 'turn' && (
          <Card title={`${game.category} · ${game.letter}`}>
            <Text style={styles.turn}>Your turn</Text>
            <View accessibilityLabel="Alphabet board" style={styles.board}>
              {controller.board().map((entry) => (
                <Text
                  key={entry.letter}
                  accessibilityLabel={`${entry.letter} ${entry.status}`}
                  style={[
                    styles.letter,
                    entry.status === 'active' && styles.activeLetter,
                    (entry.status === 'burned' || entry.status === 'void') && styles.inactiveLetter,
                  ]}
                >
                  {entry.letter}
                </Text>
              ))}
            </View>
            <Text style={styles.copy}>
              {Math.ceil(controller.remainingMs() / 1000)} seconds
              {controller.isWarning() ? ' · warning' : ''}
            </Text>
            <Action
              testID="burn-word"
              label={`Burn “${game.letter}nswer”`}
              onPress={() =>
                controller.burn(`${game.letter}nswer`, `burn-${game.round}-${game.activePlayerId}`)
              }
            />
            <Action
              testID="challenge"
              label="Challenge answer"
              onPress={() => controller.openChallenge()}
            />
            <Action
              testID="timeout"
              label="Simulate timeout"
              onPress={() => controller.timeout()}
            />
            <Action
              testID={game.paused ? 'resume-match' : 'pause-match'}
              label={game.paused ? 'Resume match' : 'Pause match'}
              onPress={() => (game.paused ? controller.resume() : controller.pause())}
            />
            <Text style={styles.copy}>Burned: {game.burned.join(', ') || 'none'}</Text>
          </Card>
        )}
        {game.phase === 'challenge' && (
          <Card title="Challenge">
            <Action
              testID="vote-invalid"
              label="Vote invalid"
              onPress={() => controller.vote('p1', 'invalid')}
            />
            <Action
              testID="resolve-challenge"
              label="Resolve vote"
              onPress={() => controller.resolveChallenge()}
            />
          </Card>
        )}
        {game.phase === 'results' && (
          <Card title="Winner">
            <Text testID="winner" style={styles.turn}>
              {game.players.find((p) => p.id === game.winnerId)?.name ?? 'Nobody'}
            </Text>
            <Action
              testID="share-results"
              label="Share results"
              onPress={() => void Share.share(controller.resultsSharePayload())}
            />
            <Action
              testID="rematch"
              label="Rematch"
              onPress={() => controller.rematch('mobile-rematch')}
            />
          </Card>
        )}
        {game.phase !== 'entry' && game.phase !== 'results' && (
          <Card title="Host booth">
            <Action
              testID="stage-rules"
              label="Stage faster turns"
              onPress={() => controller.stageRules({ speedUpMs: 1_000 })}
            />
            <Action
              testID="recover-host"
              label="Recover host"
              onPress={() => controller.recoverHost()}
            />
            {controller.activityProjection().at(-1) && (
              <Action
                testID="react-activity"
                label="React to activity"
                onPress={() => controller.reactToLatest('p1', '🔥')}
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
    </SafeAreaView>
  )
}

function ActiveTableWakeLock() {
  useKeepAwake('burndown-shared-table')
  return null
}

function Card({
  title,
  titleTestID,
  children,
}: {
  title: string
  titleTestID?: string
  children: React.ReactNode
}) {
  return (
    <View style={styles.card}>
      <Text testID={titleTestID} accessibilityRole="header" style={styles.heading}>
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
  screen: { flex: 1, backgroundColor: '#160d08' },
  content: { padding: 24, gap: 18 },
  brand: { color: '#ff6b35', fontSize: 34, fontWeight: '900', letterSpacing: 2 },
  card: {
    backgroundColor: '#2a1710',
    borderColor: '#5f2d1c',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  heading: { color: '#fff4e8', fontSize: 24, fontWeight: '800' },
  copy: { color: '#e8c9b5', fontSize: 17 },
  meta: { color: '#bd8f77', fontSize: 14 },
  libraryRow: { borderBottomColor: '#5f2d1c', borderBottomWidth: 1, paddingVertical: 10, gap: 4 },
  qr: { alignSelf: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 12 },
  turn: { color: '#ffd166', fontSize: 32, fontWeight: '900' },
  notice: { color: '#fff', backgroundColor: '#8b1e1e', borderRadius: 10, padding: 12 },
  button: {
    minHeight: 48,
    backgroundColor: '#d9481c',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  sections: { flexDirection: 'row', gap: 8 },
  section: {
    minHeight: 48,
    flex: 1,
    borderRadius: 10,
    borderColor: '#5f2d1c',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSection: { backgroundColor: '#5f2d1c' },
  sectionText: { color: '#fff4e8', fontWeight: '800' },
  board: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  letter: {
    color: '#fff4e8',
    borderColor: '#5f2d1c',
    borderWidth: 1,
    borderRadius: 6,
    minWidth: 30,
    minHeight: 30,
    textAlign: 'center',
    paddingTop: 5,
    fontWeight: '800',
  },
  activeLetter: { backgroundColor: '#d9481c', borderColor: '#ffd166' },
  inactiveLetter: {
    color: '#765443',
    textDecorationLine: 'line-through',
  },
})
