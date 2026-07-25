import { useEffect, useMemo, useState } from 'react'
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { BlankSlateController, type BlankSlateState } from '../lib/blankslate'

export default function BlankSlateApp() {
  const controller = useMemo(() => new BlankSlateController(), [])
  const [game, setGame] = useState<BlankSlateState>(controller.state)
  useEffect(() => controller.subscribe(setGame), [controller])

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.brand}>
          BLANK SLATE
        </Text>
        {game.notice && (
          <Text accessibilityRole="alert" style={styles.notice}>
            {game.notice}
          </Text>
        )}
        {game.phase === 'entry' && (
          <Card title="Match your friends">
            <Action
              testID="guest-entry"
              label="Continue as guest"
              onPress={() => controller.enter()}
            />
          </Card>
        )}
        {game.phase === 'lobby' && (
          <Card title="Lobby">
            <Text style={styles.copy}>{game.players.map((player) => player.name).join(' · ')}</Text>
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
            <Action
              testID="submit-alex"
              label="Alex writes cake"
              onPress={() => controller.submit('p1', 'cake', `p1-${game.round}`)}
            />
            <Action
              testID="submit-sam"
              label="Sam writes cake"
              onPress={() => controller.submit('p2', 'cake', `p2-${game.round}`)}
            />
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
            <Action
              testID="approve-merge"
              label="Approve first group"
              onPress={() => controller.vote('p1', game.groups[0]?.id ?? '', true)}
            />
            <Action testID="close-vote" label="Close vote" onPress={() => controller.closeVote()} />
          </Card>
        )}
        {game.phase === 'summary' && (
          <Card title="Scoreboard">
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
              testID="rematch"
              label="Rematch"
              onPress={() => controller.rematch('native-rematch')}
            />
          </Card>
        )}
      </ScrollView>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {['Play', 'Games', 'Library', 'Build', 'You'].map((tab) => (
          <Text accessibilityRole="tab" key={tab} style={styles.tab}>
            {tab}
          </Text>
        ))}
      </View>
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
  notice: { color: '#fff', backgroundColor: '#8b1e1e', padding: 12, borderRadius: 10 },
  slate: { backgroundColor: '#f5e7c6', borderRadius: 10, padding: 14 },
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
  tab: { color: '#f5e7c6', minWidth: 48, textAlign: 'center', paddingVertical: 14 },
})
