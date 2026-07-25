import { useEffect, useMemo, useState } from 'react'
import { Pressable, SafeAreaView, Share, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as Linking from 'expo-linking'
import * as SQLite from 'expo-sqlite'
import QRCode from 'react-native-qrcode-svg'
import { createSQLiteDraftStorage } from '@lastshotlabs/pocketshot/drafts'
import { PartyDemoController, type PartyState } from '../lib/party'

export default function PartyShell({ initialJoinCode }: { initialJoinCode?: string } = {}) {
  const controller = useMemo(
    () => new PartyDemoController(createSQLiteDraftStorage('party-shell.db', SQLite)),
    [],
  )
  const [party, setParty] = useState<PartyState>(controller.state)
  useEffect(() => controller.subscribe(setParty), [controller])
  useEffect(() => {
    void controller.restoreAccount()
  }, [controller])
  useEffect(() => {
    if (initialJoinCode) {
      controller.join(initialJoinCode.toUpperCase(), 'Linked guest')
    } else {
      void Linking.getInitialURL().then((url) => {
        if (url) controller.joinFromUrl(url)
      })
    }
    return Linking.addEventListener('url', ({ url }) => controller.joinFromUrl(url)).remove
  }, [controller, initialJoinCode])

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
            label="Continue with Apple"
            onPress={() => void controller.completeAccountOAuth('apple')}
          />
          <Action
            testID="spotify-connect"
            label="Connect Spotify playback"
            onPress={() => controller.connectSpotify()}
          />
          <Text style={styles.copy}>
            Account: {party.accountStatus}
            {party.accountEmail ? ` · ${party.accountEmail}` : ''}
          </Text>
          <Text style={styles.copy}>
            {party.playbackCapabilities
              .map(
                (provider) =>
                  `${provider.provider}: ${provider.isAuthorized ? 'connected' : 'preview fallback'}`,
              )
              .join(' · ')}
          </Text>
        </Panel>
      )}
      {party.phase === 'lobby' && (
        <Panel title="Lobby">
          {party.players.map((player) => (
            <Text key={player.id} style={styles.copy}>
              {player.name} · {player.ready ? 'Ready' : 'Waiting'}
            </Text>
          ))}
          <Text style={styles.copy}>
            {party.settings.preset} · first to {party.settings.targetCards} cards
          </Text>
          <Action
            testID="classic-preset"
            label="Use Classic rules"
            onPress={() => controller.applyPreset('classic')}
          />
          <Action
            testID="cutthroat-preset"
            label="Use Cutthroat rules"
            onPress={() => controller.applyPreset('cutthroat')}
          />
          <Action
            testID="choose-team-two"
            label="Join Team Two"
            onPress={() => controller.assignTeam('guest-1', 'team-2')}
          />
          <Action testID="ready" label="Ready up" onPress={() => controller.ready()} />
          <Action
            testID="claim-seat"
            label="Claim player seat"
            onPress={() => controller.claimSeat('guest-1', 1)}
          />
          <Action
            testID="handoff-seat"
            label="Hand host seat to Alex"
            onPress={() => controller.handoffSeat('host-1', 'guest-1')}
          />
          <Text style={styles.copy}>
            Seats:{' '}
            {controller
              .seatProjection()
              .map((member) => `${member.displayName} ${member.seat ?? 'spectator'}`)
              .join(' · ')}
          </Text>
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
          <Action testID="edit-deck" label="Edit deck" onPress={() => void controller.openDeck()} />
          <Action
            testID="test-playback"
            label="Test provider playback"
            onPress={() => void controller.resolveDemoPlayback()}
          />
          <Text style={styles.copy}>{party.playbackSource ?? 'Playback not started'}</Text>
        </Panel>
      )}
      {party.phase === 'round' && (
        <Panel title={`Round ${party.round}`}>
          <Text style={styles.question}>{party.question}</Text>
          <Text style={styles.copy}>
            {party.paused ? 'Paused' : 'Playing'} · {party.muted ? 'Muted' : 'Audio on'} ·{' '}
            {party.activityCount} activities
          </Text>
          <Action
            testID="submit-answer"
            label="Lock in answer"
            onPress={() => controller.answer(3)}
          />
          <Text style={styles.private}>Answer stays private on the player device.</Text>
          <Action
            testID="toggle-mute"
            label={party.muted ? 'Unmute shared playback' : 'Mute shared playback'}
            onPress={() => controller.toggleMute()}
          />
          <Action
            testID="pause-resume"
            label={party.paused ? 'Resume match' : 'Pause match'}
            onPress={() => (party.paused ? controller.resumeMatch() : controller.pauseMatch())}
          />
          <Action
            testID="adjust-tokens"
            label="Grant a token"
            onPress={() => controller.adjustTokens(1)}
          />
          <Action
            testID="react-activity"
            label="React to activity"
            onPress={() => controller.reactToLatest('guest-1', '🔥')}
          />
          {!party.endConfirmationPending ? (
            <Action
              testID="request-end"
              label="End match"
              onPress={() => controller.requestEndMatch()}
            />
          ) : (
            <>
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
        </Panel>
      )}
      {party.phase === 'results' && (
        <Panel title="Results">
          <Text style={styles.score}>{party.score} points</Text>
          <Action
            testID="share-results"
            label="Share results"
            onPress={() => void Share.share(controller.resultsSharePayload())}
          />
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
          <Action
            testID="import-playlist"
            label="Import provider playlist"
            onPress={() => void controller.importDemoPlaylist()}
          />
          <Action
            testID="search-add-track"
            label="Search providers and add track"
            onPress={() => void controller.searchAndAddTrack('dance classic')}
          />
          {controller.deckLibrary.snapshot[0]?.tracks.length > 0 && (
            <>
              <Action
                testID="audition-track"
                label="Audition first track"
                onPress={() => void controller.auditionFirstTrack()}
              />
              <Action
                testID="correct-track-year"
                label="Correct first track year"
                onPress={() => controller.correctFirstTrackYear(1984)}
              />
              <Action
                testID="replace-track"
                label="Replace first track"
                onPress={() => controller.replaceFirstTrack()}
              />
              <Action
                testID="combine-decks"
                label="Combine with Party Favorites"
                onPress={() => controller.combineDemoDeck()}
              />
            </>
          )}
          {!controller.deckLibrary.proposalSnapshot.length && (
            <Action
              testID="request-digger"
              label="Ask Digger for tracks"
              onPress={() => controller.proposeDiggerTracks()}
            />
          )}
          {controller.deckLibrary.proposalSnapshot.some(
            (proposal) => proposal.status === 'pending',
          ) && (
            <>
              <Text style={styles.copy}>AI suggestions require explicit host review.</Text>
              <Action
                testID="accept-digger"
                label="Review and accept Digger suggestion"
                onPress={() => controller.reviewDiggerTracks(true)}
              />
              <Action
                testID="reject-digger"
                label="Review and reject Digger suggestion"
                onPress={() => controller.reviewDiggerTracks(false)}
              />
            </>
          )}
          <Text style={styles.copy}>
            {controller.deckHealth().playable} playable · {controller.providerCapabilities().length}{' '}
            connected providers
          </Text>
          <Text testID="deck-action-status" style={styles.copy}>
            {party.deckAction ?? 'No deck action yet'}
          </Text>
          <Text style={styles.copy}>
            Versions: {controller.deckLibrary.history('friday-mix').length} ·{' '}
            {party.deckExport ?? 'Not exported'}
          </Text>
          {controller.deckHealth().isPublishable &&
            controller.deckLibrary.snapshot[0]?.status === 'draft' && (
              <Action
                testID="publish-deck"
                label="Submit, approve, and publish"
                onPress={() => controller.publishDeck('2026-07-25T12:00:00.000Z')}
              />
            )}
          {controller.deckLibrary.snapshot[0]?.status === 'published' && (
            <>
              <Action
                testID="rate-deck"
                label="Rate deck five stars"
                onPress={() => controller.rateDeck(5)}
              />
              <Action
                testID="export-deck-json"
                label="Export deck JSON"
                onPress={() => controller.exportDeck('json')}
              />
              <Action
                testID="export-deck-csv"
                label="Export deck CSV"
                onPress={() => controller.exportDeck('csv')}
              />
              <Action
                testID="archive-deck"
                label="Archive deck"
                onPress={() => controller.archiveDeck()}
              />
              <Text style={styles.copy}>
                Rating: {controller.deckCatalog()[0]?.averageRating ?? 'unrated'}
              </Text>
            </>
          )}
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
