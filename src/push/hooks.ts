import { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { ApiClient } from '../api/client'
import type { PushLifecycleController } from './controller'
import type {
  PushPermissionResult,
  PushPermissionStatus,
  PushNotification,
  NotificationTapEvent,
  PushRegistrationOptions,
  PushTokenRegistrationPayload,
  PushTokenRegistrationResponse,
} from './types'

// ── Optional peer dep ─────────────────────────────────────────────────────────

function requireNotifications() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as {
      getPermissionsAsync(): Promise<{ status: string; canAskAgain: boolean; granted: boolean }>
      requestPermissionsAsync(): Promise<{ status: string; canAskAgain: boolean; granted: boolean }>
      getExpoPushTokenAsync(opts?: { projectId?: string }): Promise<{ data: string }>
      addNotificationReceivedListener(cb: (n: unknown) => void): { remove(): void }
      addNotificationResponseReceivedListener(cb: (r: unknown) => void): { remove(): void }
      setNotificationHandler(handler: {
        handleNotification(): Promise<{
          shouldShowAlert: boolean
          shouldPlaySound: boolean
          shouldSetBadge: boolean
        }>
      }): void
    }
  } catch {
    throw new Error(
      '[pocketshot] Push notifications require expo-notifications.\nInstall it: npx expo install expo-notifications',
    )
  }
}

function tryLoadConstants() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const C = require('expo-constants') as {
      default: { expoConfig?: { extra?: { eas?: { projectId?: string } } } }
    }
    return C.default
  } catch {
    return null
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizePermissionStatus(raw: string): PushPermissionStatus {
  if (raw === 'granted') return 'granted'
  if (raw === 'denied') return 'denied'
  return 'undetermined'
}

function normalizeNotification(raw: unknown): PushNotification {
  const n = raw as {
    request?: {
      identifier?: string
      content?: { title?: string | null; body?: string | null; data?: Record<string, unknown> }
    }
    date?: number
  }
  return {
    notificationId: n.request?.identifier ?? '',
    title: n.request?.content?.title ?? null,
    body: n.request?.content?.body ?? null,
    data: n.request?.content?.data ?? {},
    receivedAt: n.date
      ? new Date(n.date < 10_000_000_000 ? n.date * 1_000 : n.date).toISOString()
      : new Date().toISOString(),
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Creates push notification hooks bound to the provided API client.
 */
export function createPushHooks(api: ApiClient) {
  /**
   * Queries the current push notification permission status.
   * Does NOT request permission — use `usePushPermissionRequest` for that.
   *
   * @throws If expo-notifications is not installed.
   */
  function usePushPermissionStatus() {
    const { data, isLoading, refetch } = useQuery<PushPermissionResult>({
      queryKey: ['push', 'permission'],
      queryFn: async () => {
        const Notifications = requireNotifications()
        const result = await Notifications.getPermissionsAsync()
        return {
          status: normalizePermissionStatus(result.status),
          canAskAgain: result.canAskAgain,
          granted: result.granted,
        }
      },
      staleTime: 30_000,
      retry: false,
    })
    return {
      permissionStatus: data ?? null,
      isLoading,
      refetchPermission: refetch,
    }
  }

  /**
   * Mutation that requests push notification permission from the OS.
   *
   * Rule: Never request permissions at launch. Call this only when the user
   * triggers a contextually relevant action (e.g. enabling notifications in settings).
   *
   * @throws If expo-notifications is not installed (thrown lazily on first call).
   *
   * @example
   * const { requestPermission, isPending } = usePushPermissionRequest()
   * <Button onPress={requestPermission} title="Enable Notifications" />
   */
  function usePushPermissionRequest() {
    const mutation = useMutation<PushPermissionResult, Error, void>({
      mutationFn: async () => {
        const Notifications = requireNotifications()
        const result = await Notifications.requestPermissionsAsync()
        return {
          status: normalizePermissionStatus(result.status),
          canAskAgain: result.canAskAgain,
          granted: result.granted,
        }
      },
    })
    return {
      requestPermission: mutation.mutate,
      requestPermissionAsync: mutation.mutateAsync,
      isPending: mutation.isPending,
      result: mutation.data ?? null,
      error: mutation.error,
    }
  }

  /**
   * Queries the Expo push token for this device installation.
   * Only resolves when permission has been granted.
   *
   * @param enabled - Set to false to skip token fetch (e.g. when permission not granted). Default: true.
   * @throws If expo-notifications is not installed.
   *
   * @example
   * const { granted } = usePushPermissionStatus()
   * const { pushToken } = useExpoPushToken({ enabled: granted })
   */
  function useExpoPushToken(opts: { enabled?: boolean } = {}) {
    const enabled = opts.enabled ?? true

    const {
      data: pushToken = null,
      isLoading,
      error,
    } = useQuery<string | null>({
      queryKey: ['push', 'token'],
      queryFn: async () => {
        const Notifications = requireNotifications()
        const Constants = tryLoadConstants()
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId
        const result = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        )
        return result.data
      },
      enabled,
      staleTime: Infinity,
      retry: false,
    })

    return { pushToken, isLoading, error }
  }

  /**
   * Mutation to register the device's push token with the backend.
   * Call this after you have the push token from `useExpoPushToken`.
   *
   * @example
   * const { registerPushToken, isPending } = usePushRegistration()
   * useEffect(() => {
   *   if (pushToken) registerPushToken({ pushToken })
   * }, [pushToken])
   */
  function usePushRegistration(opts: PushRegistrationOptions = {}) {
    const endpoint = opts.endpoint ?? '/device/push-token'

    const mutation = useMutation<PushTokenRegistrationResponse, Error, { pushToken: string }>({
      mutationFn: async ({ pushToken }) => {
        const payload: PushTokenRegistrationPayload = {
          pushToken,
          platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
          metadata: opts.metadata,
        }
        return api.post<PushTokenRegistrationResponse>(endpoint, payload)
      },
    })

    return {
      registerPushToken: mutation.mutate,
      registerPushTokenAsync: mutation.mutateAsync,
      isPending: mutation.isPending,
      isSuccess: mutation.isSuccess,
      error: mutation.error,
      registrationResult: mutation.data ?? null,
    }
  }

  /**
   * Subscribes to push notification events: received (foreground) and tapped.
   *
   * Sets the foreground notification handler to show alert + play sound + set badge.
   * Both callbacks are stable-ref'd so callers don't need to memoize them.
   *
   * @throws If expo-notifications is not installed (thrown lazily on mount).
   *
   * @example
   * usePushNotifications({
   *   onNotificationReceived: (n) => console.log('received', n.title),
   *   onNotificationTapped: (e) => router.push(`/notifications/${e.notification.notificationId}`),
   * })
   */
  function usePushNotifications(
    opts: {
      onNotificationReceived?: (notification: PushNotification) => void
      onNotificationTapped?: (event: NotificationTapEvent) => void
    } = {},
  ) {
    const onReceivedRef = useRef(opts.onNotificationReceived)
    const onTappedRef = useRef(opts.onNotificationTapped)
    onReceivedRef.current = opts.onNotificationReceived
    onTappedRef.current = opts.onNotificationTapped

    const [lastNotification, setLastNotification] = useState<PushNotification | null>(null)
    const [lastTapEvent, setLastTapEvent] = useState<NotificationTapEvent | null>(null)

    useEffect(() => {
      let Notifications: ReturnType<typeof requireNotifications>
      try {
        Notifications = requireNotifications()
      } catch (e) {
        console.warn((e as Error).message)
        return
      }

      // Show notification as alert when app is foregrounded
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      })

      const receivedSub = Notifications.addNotificationReceivedListener((raw) => {
        const notification = normalizeNotification(raw)
        setLastNotification(notification)
        onReceivedRef.current?.(notification)
      })

      const tappedSub = Notifications.addNotificationResponseReceivedListener((raw) => {
        const response = raw as { notification: unknown; actionIdentifier: string }
        const event: NotificationTapEvent = {
          notification: normalizeNotification(response.notification),
          actionIdentifier: response.actionIdentifier,
        }
        setLastTapEvent(event)
        onTappedRef.current?.(event)
      })

      return () => {
        receivedSub.remove()
        tappedSub.remove()
      }
    }, [])

    return { lastNotification, lastTapEvent }
  }

  /**
   * Recommended process-level hook. It projects the production lifecycle
   * controller into React without reimplementing native registration behavior.
   */
  function usePushLifecycle(
    controller: PushLifecycleController,
    options: { autoStart?: boolean } = {},
  ) {
    const [state, setState] = useState(controller.state)
    useEffect(() => {
      const unsubscribe = controller.subscribe(setState)
      if (options.autoStart ?? true) void controller.start()
      return unsubscribe
    }, [controller, options.autoStart])
    return {
      ...state,
      start: () => controller.start(),
      enable: () => controller.enable(),
      revoke: () => controller.revoke(),
      openSettings: () => controller.openSettings(),
    }
  }

  return {
    usePushLifecycle,
    usePushPermissionStatus,
    usePushPermissionRequest,
    useExpoPushToken,
    usePushRegistration,
    usePushNotifications,
  }
}

export type PushHooks = ReturnType<typeof createPushHooks>
