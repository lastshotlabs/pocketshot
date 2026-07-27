/**
 * Generates the push notification setup hook.
 * Placed at lib/usePushSetup.ts in the scaffolded app.
 */
export function pushSetupTemplate(): string {
  return `import { useEffect } from 'react'
import type { NotificationTapEvent } from '@lastshotlabs/pocketshot'
import { pocketshot } from '@/lib/pocketshot'

export interface UsePushSetupOptions {
  /**
   * App-owned routing policy for a notification the user opened.
   * Validate the data payload before navigating.
   */
  onNotificationTapped: (event: NotificationTapEvent) => void
}

/**
 * Call this once in your root layout to register for push notifications.
 * Only registers after the user has explicitly granted permission.
 */
export function usePushSetup({ onNotificationTapped }: UsePushSetupOptions) {
  const { usePushPermissionStatus, useExpoPushToken, usePushRegistration, usePushNotifications } = pocketshot

  const { permissionStatus } = usePushPermissionStatus()
  const { pushToken } = useExpoPushToken({ enabled: permissionStatus?.granted ?? false })
  const { registerPushToken } = usePushRegistration()

  useEffect(() => {
    if (pushToken) {
      registerPushToken({ pushToken })
    }
  }, [pushToken])

  usePushNotifications({ onNotificationTapped })
}
`
}
