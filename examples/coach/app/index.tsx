import { useEffect, useMemo, useState } from 'react'
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as ImagePicker from 'expo-image-picker'
import * as Linking from 'expo-linking'
import { createExpoMediaCaptureAdapter } from '@lastshotlabs/pocketshot/media'
import { CoachDemoController, type CoachState } from '../lib/coach'

export default function CoachShell() {
  const coach = useMemo(
    () =>
      new CoachDemoController(
        createExpoMediaCaptureAdapter({
          imagePicker: ImagePicker,
          openSettings: Linking.openSettings,
        }),
      ),
    [],
  )
  const [state, setState] = useState<CoachState>(coach.state)
  useEffect(() => {
    const unsubscribe = coach.subscribe(setState)
    void coach.initialize()
    return unsubscribe
  }, [coach])

  const assistantMessages =
    state.conversation?.messages.filter((message) => message.role === 'assistant') ?? []
  const assistant = assistantMessages[assistantMessages.length - 1]
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          PocketShot Coach
        </Text>
        <Card title="Conversation">
          <Text style={styles.copy}>{assistant?.text || 'Ready for your first check-in.'}</Text>
          <Action
            testID="ask-coach"
            label="Ask coach"
            onPress={() => void coach.ask('What should I do?')}
          />
          {assistant?.actions[0]?.status === 'proposed' && (
            <Action
              testID="confirm-action"
              label="Review and log 8"
              onPress={() => void coach.confirmLatestAction(8)}
            />
          )}
          <Action
            testID="undo-action"
            label="Undo latest log"
            onPress={() => void coach.undoLatestAction()}
          />
        </Card>
        <Card title="Photo analysis">
          <Text style={styles.copy}>{state.mediaStatus ?? 'No analysis yet.'}</Text>
          <Action
            testID="analyze-photo"
            label="Capture and analyze"
            onPress={() => void coach.analyzePhoto()}
          />
        </Card>
        <Card title="History and memory">
          <Text style={styles.copy}>
            Active logs: {state.logs.filter((log) => !log.undone).length}
          </Text>
          <Text style={styles.copy}>Trusted facts: {state.memory.length}</Text>
          <Action
            testID="remember"
            label="Remember morning preference"
            onPress={() => void coach.remember('Prefers mornings')}
          />
        </Card>
        <Card title="Privacy">
          <Text style={styles.copy}>Export: {state.exportStatus}</Text>
          <Action
            testID="request-export"
            label="Request privacy export"
            onPress={() => coach.requestExport()}
          />
        </Card>
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
  screen: { flex: 1, backgroundColor: '#f5f3ff' },
  content: { padding: 22, gap: 16 },
  title: { color: '#312e81', fontSize: 30, fontWeight: '900' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, gap: 12 },
  heading: { color: '#312e81', fontSize: 20, fontWeight: '800' },
  copy: { color: '#374151', fontSize: 16, lineHeight: 23 },
  button: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  buttonText: { color: '#fff', fontWeight: '800' },
})
