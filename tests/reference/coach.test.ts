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
})
