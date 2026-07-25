import { describe, expect, it } from 'vitest'
import { CoachDemoController } from '../../examples/coach/lib/coach'

describe('Coach clean-room acceptance model', () => {
  it('composes registration, email verification, secure session state, and logout', async () => {
    const coach = new CoachDemoController()
    await coach.initialize()
    await coach.registerDemoAccount()
    expect(coach.state).toMatchObject({
      accountStatus: 'verification-required',
      accountEmail: 'alex@example.com',
    })
    await coach.verifyDemoAccount()
    expect(coach.state.accountStatus).toBe('authenticated')
    await coach.signOut()
    expect(coach.state.accountStatus).toBe('anonymous')
  })

  it('composes login, OAuth, forgot-password, and reset-password returns', async () => {
    const login = new CoachDemoController()
    await login.signInDemoAccount()
    expect(login.state.accountStatus).toBe('authenticated')

    const oauth = new CoachDemoController()
    await oauth.completeDemoOAuth('google')
    expect(oauth.state).toMatchObject({
      accountStatus: 'authenticated',
      accountEmail: 'alex@example.com',
    })

    const recovery = new CoachDemoController()
    await recovery.requestPasswordReset()
    expect(recovery.state).toMatchObject({
      accountStatus: 'anonymous',
      accountEmail: 'alex@example.com',
    })
    await recovery.completePasswordReset()
    expect(recovery.state).toMatchObject({ accountStatus: 'anonymous', accountEmail: null })
  })

  it('streams advice and requires review before committing an action', async () => {
    const coach = new CoachDemoController()
    await coach.initialize()
    await coach.ask('What should I do?')
    const assistant = coach.state.conversation?.messages.at(-1)
    expect(assistant).toMatchObject({
      text: 'Try a short walk after lunch.',
      status: 'complete',
      citations: [{ id: 'source-1', title: 'Activity evidence' }],
      actions: [expect.objectContaining({ status: 'proposed' })],
    })
    expect(coach.state.conversation?.usage?.remaining).toBe(88)
    expect(coach.state.logs).toHaveLength(0)
    await coach.confirmLatestAction(8)
    expect(coach.state.logs).toEqual([expect.objectContaining({ value: 8, undone: false })])
  })

  it('retries the latest advice turn without duplicating streamed text', async () => {
    const coach = new CoachDemoController()
    await coach.initialize()
    await coach.ask('What should I do?')
    await coach.retryAdvice()
    const assistant = coach.state.conversation?.messages.at(-1)
    expect(assistant).toMatchObject({
      text: 'Try a short walk after lunch.',
      status: 'complete',
    })
    expect(assistant?.text.match(/Try a short walk/g)).toHaveLength(1)
  })

  it('supports audit-friendly undo', async () => {
    const coach = new CoachDemoController()
    await coach.initialize()
    await coach.ask('Log this')
    await coach.confirmLatestAction()
    await coach.undoLatestAction()
    expect(coach.state.logs[0].undone).toBe(true)
    expect(coach.state.conversation?.messages.at(-1)?.actions[0].status).toBe('undone')
  })

  it('completes capture, resumable upload, and photo analysis', async () => {
    const coach = new CoachDemoController()
    await coach.initialize()
    await coach.analyzePhoto()
    expect(coach.state.mediaStatus).toBe('Balanced meal · analysis complete')
    expect(coach.state.mediaHistory).toEqual([expect.objectContaining({ status: 'complete' })])
    await coach.deletePhoto(coach.state.mediaHistory[0].id)
    expect(coach.state.mediaHistory).toEqual([])
  })

  it('keeps the app usable when camera permission is blocked', async () => {
    const coach = new CoachDemoController({
      requestPermission: async () => ({
        state: 'blocked',
        canAskAgain: false,
        openSettings: async () => undefined,
      }),
      acquire: async () => null,
    })
    await expect(coach.analyzePhoto()).rejects.toMatchObject({
      name: 'MediaPermissionError',
      source: 'camera',
    })
    expect(coach.state.conversation).toBeNull()
  })

  it('manages trusted memory and privacy export lifecycle', async () => {
    const coach = new CoachDemoController()
    await expect(coach.remember('Prefers mornings')).rejects.toThrow('consent')
    coach.setMemoryConsent(true)
    await coach.remember('Prefers mornings')
    expect(coach.state.memory).toEqual([
      expect.objectContaining({ content: 'Prefers mornings', trusted: true }),
    ])
    await coach.editMemory(coach.state.memory[0].id, 'Prefers early mornings')
    expect(coach.state.memory[0].content).toBe('Prefers early mornings')
    await coach.deleteMemory(coach.state.memory[0].id)
    expect(coach.state.memory).toEqual([])

    await coach.requestExport()
    expect(coach.state.exportStatus).toBe('requested')
    await coach.refreshExport()
    expect(coach.state.exportStatus).toBe('ready')
  })

  it('schedules, cancels, and completes account deletion with local cleanup', async () => {
    const coach = new CoachDemoController()
    await coach.initialize()
    coach.setMemoryConsent(true)
    await coach.remember('Private fact')
    coach.logWeight('private-metric', 80)

    await coach.requestDeletion()
    expect(coach.state.deletionStatus).toBe('scheduled')
    await coach.cancelDeletion()
    expect(coach.state.deletionStatus).toBe('cancelled')
    expect(coach.state.memory).toHaveLength(1)

    await coach.requestDeletion()
    await coach.completeDeletion()
    expect(coach.state).toMatchObject({
      deletionStatus: 'completed',
      localDataCleared: true,
      accountStatus: 'anonymous',
      memory: [],
      chartPoints: [],
    })
  })

  it('logs idempotent metrics and produces goal/chart state', () => {
    const coach = new CoachDemoController()
    coach.logWeight('client-weight', 80)
    coach.logWeight('client-weight', 80)
    coach.setWeightGoal(100)
    expect(coach.state).toMatchObject({
      chartPoints: [80],
      goalProgress: 0.8,
    })
  })

  it('builds and completes a restart-safe workout session', () => {
    const coach = new CoachDemoController()
    coach.startWorkout()
    coach.logWorkoutSet()
    coach.logWorkoutSet()
    expect(coach.workouts.snapshot.session?.sets).toHaveLength(1)
    coach.completeWorkout()
    expect(coach.state.workoutStatus).toBe('complete')
    expect(coach.workouts.snapshot.session?.status).toBe('complete')
    expect(coach.state.workoutSync).toBe('pending')
    coach.simulateWorkoutSyncConflict()
    expect(coach.state.workoutSync).toBe('conflict')
    coach.resolveWorkoutConflict('keep-local')
    expect(coach.workouts.snapshot.session?.sets).toHaveLength(1)
    coach.acknowledgeWorkoutSync()
    expect(coach.state.workoutSync).toBe('synced')
  })

  it('supports purchase and restore entitlement paths', async () => {
    const coach = new CoachDemoController()
    await coach.purchasePro()
    expect(coach.state.proAccess).toBe(true)

    const restored = new CoachDemoController()
    await restored.restorePro()
    expect(restored.state.proAccess).toBe(true)
    expect(restored.billing.snapshot.entitlements[0].state).toBe('grace')
  })
})
