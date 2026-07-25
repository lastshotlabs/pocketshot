import { useEffect, useMemo, useState } from 'react'
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as Linking from 'expo-linking'
import * as SQLite from 'expo-sqlite'
import QRCode from 'react-native-qrcode-svg'
import { createSQLiteDraftStorage } from '@lastshotlabs/pocketshot/drafts'
import { PartyDemoController, type PartyState } from '../lib/party'

export default function PartyShell() {
  const controller = useMemo(
    () => new PartyDemoController(createSQLiteDraftStorage('party-shell.db', SQLite)),
    [],
  )
  const [party, setParty] = useState<PartyState>(controller.state)
  useEffect(() => controller.subscribe(setParty), [controller])
  useEffect(() => {
    void Linking.getInitialURL().then((url) => {
      if (url) controller.joinFromUrl(url)
    })
    return Linking.addEventListener('url', ({ url }) => controller.joinFromUrl(url)).remove
  }, [controller])

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <Text accessibilityRole="header" style={styles.title}>
        PocketShot Party
      </Text>
      <Text testID="connection-state" style={styles.status}>
        {party.connection === 'online' ? 'Connected' : 'Reconnecting…'}
      </Text>
      {party.notice && (
        <Text accessibilityRole="alert" style={styles.notice}>
          {party.notice}
        </Text>
      )}

      {party.phase === 'entry' && (
        <Panel title="Join a party">
          <Text style={styles.code}>Code {party.joinCode}</Text>
          <View accessibilityLabel={`QR join code ${party.joinCode}`} style={styles.qr}>
            <QRCode value={`pocketshot-party://join/${party.joinCode}`} size={112} />
          </View>
          <Action
            testID="guest-entry"
            label="Continue as Alex"
            onPress={() => controller.guest('Alex')}
          />
          <Action
            testID="oauth-entry"
            label="Continue with OAuth"
            onPress={() => controller.guest('OAuth player')}
          />
        </Panel>
      )}
      {party.phase === 'lobby' && (
        <Panel title="Lobby">
          {party.players.map((player) => (
            <Text key={player.id} style={styles.copy}>
              {player.name} · {player.ready ? 'Ready' : 'Waiting'}
            </Text>
          ))}
          <Action testID="ready" label="Ready up" onPress={() => controller.ready()} />
          <Action
            testID="start-round"
            label="Start round"
            onPress={() => controller.startRound()}
          />
          <Action
            testID="simulate-reconnect"
            label="Simulate reconnect"
            onPress={() => controller.reconnect()}
          />
          <Action
            testID="edit-deck"
            label="Edit deck"
            onPress={() => void controller.openDeck()}
          />
        </Panel>
      )}
      {party.phase === 'round' && (
        <Panel title={`Round ${party.round}`}>
          <Text style={styles.question}>{party.question}</Text>
          <Action
            testID="submit-answer"
            label="Lock in answer"
            onPress={() => controller.answer(3)}
          />
          <Text style={styles.private}>Answer stays private on the player device.</Text>
        </Panel>
      )}
      {party.phase === 'results' && (
        <Panel title="Results">
          <Text style={styles.score}>{party.score} points</Text>
          <Action testID="rematch" label="Rematch" onPress={() => controller.rematch()} />
        </Panel>
      )}
      {party.phase === 'deck' && (
        <Panel title="Durable deck">
          <Text style={styles.copy}>
            {controller.deck.snapshot.value.title} · autosave and conflict-safe
          </Text>
          <Action
            testID="rename-deck"
            label="Rename deck"
            onPress={() => void controller.renameDeck('Updated Mix')}
          />
          <Action
            testID="import-track"
            label="Import demo track"
            onPress={() =>
              controller.importTracks(
                'Blue Monday,New Order,1983,https://example.test/blue-monday.mp3',
              )
            }
          />
          <Text style={styles.copy}>
            {controller.deckHealth().playable} playable · {controller.providerCapabilities().length}{' '}
            connected providers
          </Text>
          <Action
            testID="back-to-lobby"
            label="Back to lobby"
            onPress={() => controller.rematch()}
          />
        </Panel>
      )}
    </SafeAreaView>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.heading}>
        {title}
      </Text>
      {children}
    </View>
  )
}

function Action({
  label,
  onPress,
  testID,
}: {
  label: string
  onPress: () => void
  testID: string
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      style={styles.button}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111827', padding: 24, gap: 16 },
  title: { color: '#fff', fontSize: 30, fontWeight: '800' },
  status: { color: '#6ee7b7', fontWeight: '700' },
  panel: { backgroundColor: '#1f2937', borderRadius: 20, padding: 20, gap: 14 },
  heading: { color: '#fff', fontSize: 22, fontWeight: '700' },
  code: { color: '#fde68a', fontSize: 26, fontWeight: '800', letterSpacing: 2 },
  copy: { color: '#d1d5db', fontSize: 16 },
  question: { color: '#fff', fontSize: 24, fontWeight: '700' },
  score: { color: '#fde68a', fontSize: 42, fontWeight: '900' },
  private: { color: '#9ca3af', fontSize: 13 },
  notice: {
    color: '#fecaca',
    backgroundColor: '#7f1d1d',
    padding: 12,
    borderRadius: 10,
  },
  qr: { backgroundColor: '#fff', padding: 12, alignSelf: 'flex-start', borderRadius: 12 },
  button: {
    minHeight: 48,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
