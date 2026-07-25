/** Permission status for push notifications. */
export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined'

/** Result of requesting push permission. */
export interface PushPermissionResult {
  status: PushPermissionStatus
  canAskAgain: boolean
  granted: boolean
}

/** A received push notification. */
export interface PushNotification {
  /** Unique notification identifier. */
  notificationId: string
  /** Notification title. */
  title: string | null
  /** Notification body text. */
  body: string | null
  /** Arbitrary data payload attached to the notification. */
  data: Record<string, unknown>
  /** ISO timestamp when the notification was received. */
  receivedAt: string
}

/** A notification tap event (user tapped the notification). */
export interface NotificationTapEvent {
  notification: PushNotification
  actionIdentifier: string
}

/** Options for registering for push notifications. */
export interface PushRegistrationOptions {
  /** Server endpoint to POST the push token to. Default: '/device/push-token'. */
  endpoint?: string
  /** Additional fields to include in the registration payload. */
  metadata?: Record<string, unknown>
}

/** Server registration payload. */
export interface PushTokenRegistrationPayload {
  pushToken: string
  platform: 'ios' | 'android' | 'web'
  metadata?: Record<string, unknown>
}

/** Server response after push token registration. */
export interface PushTokenRegistrationResponse {
  registered: boolean
  pushToken: string
  updatedAt: string
}

export interface PersonalPush {
  id: string
  category: string
  recipientId: string
  roomId?: string
  title: string
  body: string
  route?: string
  createdAt: string
  expiresAt?: string
  data?: Record<string, unknown>
}

export interface PushQuietHours {
  startMinute: number
  endMinute: number
  timeZoneOffsetMinutes?: number
}

export type PushDisposition =
  | { status: 'deliver'; notification: PersonalPush }
  | {
      status: 'suppressed'
      reason: 'duplicate' | 'expired' | 'muted' | 'disabled-category' | 'quiet-hours'
    }

export interface PushOpenRoute {
  notificationId: string
  route: string
  openedAt: string
  coldStart: boolean
}
