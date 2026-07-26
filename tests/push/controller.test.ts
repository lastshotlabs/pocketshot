import { describe, expect, it } from 'vitest'
import { PersonalPushPolicyController } from '../../src/push/controller'
import type { PersonalPush } from '../../src/push/types'

const notification = (patch: Partial<PersonalPush> = {}): PersonalPush => ({
  id: 'push-1',
  category: 'turn',
  recipientId: 'player-1',
  roomId: 'room-1',
  title: 'Your turn',
  body: 'Write your slate',
  route: '/join/ABC123',
  createdAt: '2026-07-25T12:00:00.000Z',
  ...patch,
})

const policy = (hour = 12) =>
  new PersonalPushPolicyController({
    allowedCategories: ['turn', 'rematch', 'final-score', 'host-knock'],
    allowedRoutePrefixes: ['/join', '/games', '/results'],
    now: () => new Date(`2026-07-25T${String(hour).padStart(2, '0')}:00:00.000Z`),
  })

describe('PersonalPushPolicyController', () => {
  it('delivers allowlisted personal notifications once', () => {
    const controller = policy()
    expect(controller.evaluate(notification()).status).toBe('deliver')
    expect(controller.evaluate(notification())).toEqual({
      status: 'suppressed',
      reason: 'duplicate',
    })
  })

  it('enforces room mute, category preference, expiry, and overnight quiet hours', () => {
    const muted = policy()
    muted.setRoomMuted('room-1', true)
    expect(muted.evaluate(notification()).status).toBe('suppressed')

    const disabled = policy()
    disabled.setCategoryEnabled('turn', false)
    expect(disabled.evaluate(notification()).status).toBe('suppressed')

    const expired = policy()
    expect(expired.evaluate(notification({ expiresAt: '2026-07-25T11:59:59.000Z' }))).toMatchObject(
      { reason: 'expired' },
    )

    const quiet = policy(23)
    quiet.setQuietHours({ startMinute: 22 * 60, endMinute: 7 * 60 })
    expect(quiet.evaluate(notification())).toMatchObject({ reason: 'quiet-hours' })
  })

  it('validates cold push routes and consumes them exactly once', () => {
    const controller = policy()
    expect(controller.open(notification(), true)).toMatchObject({
      route: '/join/ABC123',
      coldStart: true,
    })
    expect(controller.consumePendingOpen()?.route).toBe('/join/ABC123')
    expect(controller.consumePendingOpen()).toBeNull()
    expect(() =>
      controller.open(notification({ route: 'https://evil.example/steal' }), false),
    ).toThrow('app-relative')
    expect(() =>
      controller.open(notification({ route: 'https://evil.example/join/ABC123' }), false),
    ).toThrow('app-relative')
  })

  it('suppresses cross-account and malformed-expiry notifications', () => {
    const controller = new PersonalPushPolicyController({
      allowedCategories: ['turn'],
      allowedRoutePrefixes: ['/join'],
      expectedRecipientId: 'player-1',
      now: () => new Date('2026-07-25T12:00:00.000Z'),
    })
    expect(controller.evaluate(notification({ id: 'wrong', recipientId: 'player-2' }))).toEqual({
      status: 'suppressed',
      reason: 'wrong-recipient',
    })
    expect(controller.evaluate(notification({ id: 'invalid', expiresAt: 'not-a-date' }))).toEqual({
      status: 'suppressed',
      reason: 'expired',
    })
  })

  it('restores durable preferences without restoring delivery dedupe state', () => {
    const first = policy()
    first.setRoomMuted('room-2', true)
    first.setCategoryEnabled('rematch', false)
    first.setQuietHours({ startMinute: 60, endMinute: 120 })

    const restored = policy()
    restored.restore(first.snapshot())
    expect(restored.snapshot()).toEqual(first.snapshot())
    expect(restored.evaluate(notification({ id: 'new', roomId: 'room-2' }))).toMatchObject({
      reason: 'muted',
    })
  })
})
