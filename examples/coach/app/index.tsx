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
        <Card title="Account">
          <Text style={styles.copy}>
            Account: {state.accountStatus}
            {state.accountEmail ? ` · ${state.accountEmail}` : ''}
          </Text>
          {state.accountStatus === 'anonymous' && (
            <>
              <Action
                testID="register-account"
                label="Create demo account"
                onPress={() => void coach.registerDemoAccount()}
              />
              <Action
                testID="login-account"
                label="Sign in"
                onPress={() => void coach.signInDemoAccount()}
              />
              <Action
                testID="oauth-account"
                label="Continue with Apple"
                onPress={() => void coach.completeDemoOAuth('apple')}
              />
              <Action
                testID="forgot-password"
                label="Forgot password"
                onPress={() => void coach.requestPasswordReset()}
              />
              {state.accountEmail && (
                <Action
                  testID="reset-password"
                  label="Complete password reset"
                  onPress={() => void coach.completePasswordReset()}
                />
              )}
            </>
          )}
          {state.accountStatus === 'verification-required' && (
            <Action
              testID="verify-account"
              label="Verify email"
              onPress={() => void coach.verifyDemoAccount()}
            />
          )}
          {state.accountStatus === 'authenticated' && (
            <Action testID="sign-out" label="Sign out" onPress={() => void coach.signOut()} />
          )}
        </Card>
        <Card title="Conversation">
          <Text style={styles.copy}>{assistant?.text || 'Ready for your first check-in.'}</Text>
          <Text style={styles.copy}>
            Status: {assistant?.status ?? 'idle'} · Citations: {assistant?.citations.length ?? 0} ·
            Remaining: {state.conversation?.usage?.remaining ?? 'unknown'}
          </Text>
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
          {assistant?.status === 'streaming' && (
            <Action
              testID="stop-advice"
              label="Stop response"
              onPress={() => void coach.stopAdvice()}
            />
          )}
          {(assistant?.status === 'failed' || assistant?.status === 'stopped') && (
            <Action
              testID="retry-advice"
              label="Retry response"
              onPress={() => void coach.retryAdvice()}
            />
          )}
        </Card>
        <Card title="Photo analysis">
          <Text style={styles.copy}>{state.mediaStatus ?? 'No analysis yet.'}</Text>
          <Text style={styles.copy}>Photo history: {state.mediaHistory.length}</Text>
          <Action
            testID="analyze-photo"
            label="Capture and analyze"
            onPress={() => void coach.analyzePhoto()}
          />
          {state.mediaHistory[0] && (
            <Action
              testID="delete-photo"
              label="Delete latest photo"
              onPress={() => void coach.deletePhoto(state.mediaHistory[0].id)}
            />
          )}
        </Card>
        <Card title="History and memory">
          <Text style={styles.copy}>
            Active logs: {state.logs.filter((log) => !log.undone).length}
          </Text>
          <Text style={styles.copy}>Trusted facts: {state.memory.length}</Text>
          <Text style={styles.copy}>
            Memory consent: {state.memoryConsent ? 'granted' : 'not granted'}
          </Text>
          <Action
            testID="memory-consent"
            label={state.memoryConsent ? 'Revoke memory consent' : 'Allow trusted memory'}
            onPress={() => coach.setMemoryConsent(!state.memoryConsent)}
          />
          <Action
            testID="remember"
            label="Remember morning preference"
            onPress={() => void coach.remember('Prefers mornings')}
          />
          {state.memory[0] && (
            <>
              <Action
                testID="edit-memory"
                label="Edit morning preference"
                onPress={() =>
                  void coach.editMemory(state.memory[0].id, 'Prefers early morning workouts')
                }
              />
              <Action
                testID="delete-memory"
                label="Delete morning preference"
                onPress={() => void coach.deleteMemory(state.memory[0].id)}
              />
            </>
          )}
        </Card>
        <Card title="Goals and charts">
          <Text style={styles.copy}>Weight points: {state.chartPoints.join(', ') || 'none'}</Text>
          <Text style={styles.copy}>Goal progress: {Math.round(state.goalProgress * 100)}%</Text>
          <Action
            testID="log-weight"
            label="Log 80 kg"
            onPress={() => coach.logWeight('weight-client-1', 80)}
          />
          <Action
            testID="set-goal"
            label="Set 100 kg goal"
            onPress={() => coach.setWeightGoal(100)}
          />
        </Card>
        <Card title="Training">
          <Text style={styles.copy}>Workout: {state.workoutStatus}</Text>
          <Text style={styles.copy}>Sync: {state.workoutSync}</Text>
          <Action
            testID="start-workout"
            label="Start workout"
            onPress={() => coach.startWorkout()}
          />
          <Action testID="log-set" label="Log squat set" onPress={() => coach.logWorkoutSet()} />
          <Action
            testID="complete-workout"
            label="Complete workout"
            onPress={() => coach.completeWorkout()}
          />
          {state.workoutSync === 'pending' && (
            <>
              <Action
                testID="sync-workout"
                label="Sync pending workout"
                onPress={() => coach.acknowledgeWorkoutSync()}
              />
              <Action
                testID="conflict-workout"
                label="Simulate workout conflict"
                onPress={() => coach.simulateWorkoutSyncConflict()}
              />
            </>
          )}
          {state.workoutSync === 'conflict' && (
            <>
              <Action
                testID="keep-local-workout"
                label="Keep local workout"
                onPress={() => coach.resolveWorkoutConflict('keep-local')}
              />
              <Action
                testID="accept-server-workout"
                label="Use server workout"
                onPress={() => coach.resolveWorkoutConflict('accept-server')}
              />
            </>
          )}
        </Card>
        <Card title="Coach Pro">
          <Text style={styles.copy}>Access: {state.proAccess ? 'active' : 'inactive'}</Text>
          <Action
            testID="purchase-pro"
            label="Purchase Pro"
            onPress={() => void coach.purchasePro()}
          />
          <Action
            testID="restore-pro"
            label="Restore purchases"
            onPress={() => void coach.restorePro()}
          />
        </Card>
        <Card title="Privacy">
          <Text style={styles.copy}>Export: {state.exportStatus}</Text>
          <Text style={styles.copy}>Deletion: {state.deletionStatus}</Text>
          <Text style={styles.copy}>
            Local cleanup: {state.localDataCleared ? 'complete' : 'not started'}
          </Text>
          <Action
            testID="request-export"
            label="Request privacy export"
            onPress={() => void coach.requestExport()}
          />
          {state.exportStatus === 'requested' && (
            <Action
              testID="refresh-export"
              label="Refresh privacy export"
              onPress={() => void coach.refreshExport()}
            />
          )}
          {state.deletionStatus !== 'scheduled' && state.deletionStatus !== 'completed' && (
            <Action
              testID="request-deletion"
              label="Schedule account deletion"
              onPress={() => void coach.requestDeletion()}
            />
          )}
          {state.deletionStatus === 'scheduled' && (
            <>
              <Action
                testID="cancel-deletion"
                label="Cancel account deletion"
                onPress={() => void coach.cancelDeletion()}
              />
              <Action
                testID="confirm-deletion"
                label="Confirm server deletion"
                onPress={() => void coach.completeDeletion()}
              />
            </>
          )}
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
