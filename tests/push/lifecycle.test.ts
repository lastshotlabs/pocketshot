import { describe, expect, it, vi } from 'vitest'
import { PushLifecycleController } from '../../src/push/controller'
import type {
  NativePushAdapter,
  NotificationTapEvent,
  PushNotification,
} from '../../src/push/types'

const notification = (id: string): PushNotification => ({
  notificationId: id,
  title: 'Ready',
  body: 'Open the room',
  data: { route: '/rooms/42' },
  receivedAt: '2026-07-25T12:00:00.000Z',
})

const tap = (id: string): NotificationTapEvent => ({
  notification: notification(id),
  actionIdentifier: 'default',
})

function adapter(coldStart: NotificationTapEvent | null = null) {
  let received: ((value: PushNotification) => void) | undefined
  let tapped: ((value: NotificationTapEvent) => void) | undefined
  let token: ((value: string) => void) | undefined
  const removals = [vi.fn(), vi.fn(), vi.fn()]
  const value: NativePushAdapter = {
    getExpoPushToken: vi.fn(async () => 'token-1'),
    getLastNotificationResponse: vi.fn(async () => coldStart),
    subscribeReceived: vi.fn((listener) => {
      received = listener
      return removals[0]
    }),
    subscribeTapped: vi.fn((listener) => {
      tapped = listener
      return removals[1]
    }),
    subscribeToken: vi.fn((listener) => {
      token = listener
      return removals[2]
    }),
  }
  return {
    value,
    removals,
    receive: (next: PushNotification) => received?.(next),
    tap: (next: NotificationTapEvent) => tapped?.(next),
    rotate: (next: string) => token?.(next),
  }
}

describe('PushLifecycleController', () => {
  it('consumes a cold-start response before subscribing and registers its token', async () => {
    const native = adapter(tap('cold'))
    const registerToken = vi.fn(async () => undefined)
    const onTap = vi.fn()
    const controller = new PushLifecycleController({
      adapter: native.value,
      projectId: 'project',
      registerToken,
      onTap,
    })
    await controller.start()
    expect(native.value.getExpoPushToken).toHaveBeenCalledWith('project')
    expect(registerToken).toHaveBeenCalledWith('token-1')
    expect(onTap).toHaveBeenCalledWith(tap('cold'), true)
    expect(controller.state).toMatchObject({ status: 'ready', token: 'token-1' })
  })

  it('delivers foreground events, deduplicates taps, and reconciles token rotation', async () => {
    const native = adapter()
    const registerToken = vi.fn(async () => undefined)
    const onNotification = vi.fn()
    const onTap = vi.fn()
    const controller = new PushLifecycleController({
      adapter: native.value,
      registerToken,
      onNotification,
      onTap,
    })
    await controller.start()
    native.receive(notification('foreground'))
    native.tap(tap('warm'))
    native.tap(tap('warm'))
    native.rotate('token-2')
    await Promise.resolve()
    expect(onNotification).toHaveBeenCalledWith(notification('foreground'))
    expect(onTap).toHaveBeenCalledTimes(1)
    expect(registerToken).toHaveBeenNthCalledWith(2, 'token-2')
    expect(controller.state.token).toBe('token-2')
  })

  it('reports registration failure and tears down native subscriptions', async () => {
    const failed = adapter()
    const onError = vi.fn()
    const controller = new PushLifecycleController({
      adapter: failed.value,
      registerToken: async () => {
        throw new Error('registration unavailable')
      },
      onError,
    })
    await controller.start()
    expect(controller.state).toMatchObject({
      status: 'failed',
      error: 'registration unavailable',
    })
    expect(onError).toHaveBeenCalledOnce()

    const ready = adapter()
    const second = new PushLifecycleController({
      adapter: ready.value,
      registerToken: async () => undefined,
    })
    await second.start()
    second.stop()
    expect(ready.removals.every((remove) => remove.mock.calls.length === 1)).toBe(true)
    expect(second.state.status).toBe('stopped')
  })
})
