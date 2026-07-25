import type { NativePushAdapter, NotificationTapEvent, PushNotification } from './types'

export interface ExpoNotificationModule {
  getExpoPushTokenAsync(options?: { projectId?: string }): Promise<{ data: string }>
  getLastNotificationResponseAsync(): Promise<unknown | null>
  addNotificationReceivedListener(listener: (notification: unknown) => void): { remove(): void }
  addNotificationResponseReceivedListener(listener: (response: unknown) => void): { remove(): void }
  addPushTokenListener(listener: (token: { data: string }) => void): { remove(): void }
}

export function createExpoPushAdapter(module: ExpoNotificationModule): NativePushAdapter {
  return {
    async getExpoPushToken(projectId) {
      const result = await module.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
      return result.data
    },
    async getLastNotificationResponse() {
      const response = await module.getLastNotificationResponseAsync()
      return response ? normalizeResponse(response) : null
    },
    subscribeReceived(listener) {
      const subscription = module.addNotificationReceivedListener((value) =>
        listener(normalizeNotification(value)),
      )
      return () => subscription.remove()
    },
    subscribeTapped(listener) {
      const subscription = module.addNotificationResponseReceivedListener((value) =>
        listener(normalizeResponse(value)),
      )
      return () => subscription.remove()
    },
    subscribeToken(listener) {
      const subscription = module.addPushTokenListener((value) => listener(value.data))
      return () => subscription.remove()
    },
  }
}

function normalizeResponse(raw: unknown): NotificationTapEvent {
  const response = raw as { notification?: unknown; actionIdentifier?: string }
  return {
    notification: normalizeNotification(response.notification),
    actionIdentifier: response.actionIdentifier ?? 'default',
  }
}

function normalizeNotification(raw: unknown): PushNotification {
  const notification = raw as {
    request?: {
      identifier?: string
      content?: { title?: string | null; body?: string | null; data?: Record<string, unknown> }
    }
    date?: number
  }
  return {
    notificationId: notification.request?.identifier ?? '',
    title: notification.request?.content?.title ?? null,
    body: notification.request?.content?.body ?? null,
    data: notification.request?.content?.data ?? {},
    receivedAt: notification.date
      ? new Date(notification.date * 1000).toISOString()
      : new Date().toISOString(),
  }
}
