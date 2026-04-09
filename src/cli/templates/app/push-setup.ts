import type { PocketshotScaffoldConfig } from '../../types'

/**
 * Generates the push notification setup hook.
 * Placed at lib/usePushSetup.ts in the scaffolded app.
 */
export function pushSetupTemplate(_config: PocketshotScaffoldConfig): string {
  return `import { useEffect } from 'react'
import { pocketshot } from '@/lib/pocketshot'

/**
 * Call this once in your root layout to register for push notifications.
 * Only registers after the user has explicitly granted permission.
 */
export function usePushSetup() {
  const { usePushPermissionStatus, useExpoPushToken, usePushRegistration, usePushNotifications } = pocketshot

  const { permissionStatus } = usePushPermissionStatus()
  const { pushToken } = useExpoPushToken({ enabled: permissionStatus?.granted ?? false })
  const { registerPushToken } = usePushRegistration()

  useEffect(() => {
    if (pushToken) {
      registerPushToken({ pushToken })
    }
  }, [pushToken])

  usePushNotifications({
    onNotificationTapped: (event) => {
      // TODO: navigate based on event.notification.data
      console.log('Notification tapped:', event.notification.title)
    },
  })
}
`
}
