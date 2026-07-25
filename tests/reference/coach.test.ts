import { describe, expect, it } from 'vitest'
import { CoachDemoController } from '../../examples/coach/lib/coach'

describe('Coach clean-room acceptance model', () => {
  it('streams advice and requires review before committing an action', async () => {
    const coach = new CoachDemoController()
    await coach.initialize()
    await coach.ask('What should I do?')
    const assistant = coach.state.conversation?.messages.at(-1)
    expect(assistant).toMatchObject({
      text: 'Try a short walk after lunch.',
      status: 'complete',
      actions: [expect.objectContaining({ status: 'proposed' })],
    })
    expect(coach.state.logs).toHaveLength(0)
    await coach.confirmLatestAction(8)
    expect(coach.state.logs).toEqual([expect.objectContaining({ value: 8, undone: false })])
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
    await coach.remember('Prefers mornings')
    expect(coach.state.memory).toEqual([
      expect.objectContaining({ content: 'Prefers mornings', trusted: true }),
    ])
    coach.requestExport()
    expect(coach.state.exportStatus).toBe('requested')
    await Promise.resolve()
    expect(coach.state.exportStatus).toBe('ready')
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
