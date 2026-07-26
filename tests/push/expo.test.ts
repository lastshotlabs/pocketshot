import { describe, expect, it, vi } from 'vitest'
import { createExpoPushAdapter, type ExpoNotificationModule } from '../../src/push/expo'

function module() {
  let received: ((value: unknown) => void) | undefined
  let tapped: ((value: unknown) => void) | undefined
  let token: ((value: { data: string }) => void) | undefined
  const value: ExpoNotificationModule = {
    getPermissionsAsync: vi.fn(async () => ({
      status: 'undetermined',
      canAskAgain: true,
      granted: false,
    })),
    requestPermissionsAsync: vi.fn(async () => ({
      status: 'granted',
      canAskAgain: true,
      granted: true,
    })),
    getExpoPushTokenAsync: vi.fn(async () => ({ data: 'expo-token' })),
    getLastNotificationResponseAsync: vi.fn(async () => ({
      actionIdentifier: 'open',
      notification: nativeNotification('cold'),
    })),
    addNotificationReceivedListener: vi.fn((listener) => {
      received = listener
      return { remove: vi.fn() }
    }),
    addNotificationResponseReceivedListener: vi.fn((listener) => {
      tapped = listener
      return { remove: vi.fn() }
    }),
    addPushTokenListener: vi.fn((listener) => {
      token = listener
      return { remove: vi.fn() }
    }),
  }
  return {
    value,
    receive: (id: string) => received?.(nativeNotification(id)),
    tap: (id: string) =>
      tapped?.({ actionIdentifier: 'open', notification: nativeNotification(id) }),
    rotate: (next: string) => token?.({ data: next }),
  }
}

function nativeNotification(id: string) {
  return {
    request: {
      identifier: id,
      content: { title: 'Title', body: 'Body', data: { route: `/rooms/${id}` } },
    },
    date: 1_774_099_200,
  }
}

describe('createExpoPushAdapter', () => {
  it('normalizes cold, foreground, tap, and token events', async () => {
    const expo = module()
    const adapter = createExpoPushAdapter(expo.value)
    await expect(adapter.getExpoPushToken('project')).resolves.toBe('expo-token')
    expect(expo.value.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'project' })
    await expect(adapter.getLastNotificationResponse()).resolves.toMatchObject({
      actionIdentifier: 'open',
      notification: { notificationId: 'cold', data: { route: '/rooms/cold' } },
    })
    const received = vi.fn()
    const tapped = vi.fn()
    const token = vi.fn()
    adapter.subscribeReceived(received)
    adapter.subscribeTapped(tapped)
    adapter.subscribeToken(token)
    expo.receive('foreground')
    expo.tap('warm')
    expo.rotate('rotated')
    expect(received).toHaveBeenCalledWith(expect.objectContaining({ notificationId: 'foreground' }))
    expect(tapped).toHaveBeenCalledWith(
      expect.objectContaining({
        notification: expect.objectContaining({ notificationId: 'warm' }),
      }),
    )
    expect(token).toHaveBeenCalledWith('rotated')
  })

  it('preserves Expo epoch-millisecond notification dates', () => {
    const expo = module()
    const adapter = createExpoPushAdapter(expo.value)
    const received = vi.fn()
    adapter.subscribeReceived(received)
    const milliseconds = Date.parse('2026-07-25T12:00:00.000Z')
    ;(expo.value.addNotificationReceivedListener as ReturnType<typeof vi.fn>).mock.calls[0]![0]({
      ...nativeNotification('milliseconds'),
      date: milliseconds,
    })
    expect(received).toHaveBeenCalledWith(
      expect.objectContaining({ receivedAt: '2026-07-25T12:00:00.000Z' }),
    )
  })
})
