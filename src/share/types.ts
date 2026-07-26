/** Content to share via the native share sheet. */
export interface ShareContent {
  /** Text to share (e.g. a message, URL, or description). */
  message?: string
  /** URL to share. On iOS, shown as a link preview. */
  url?: string
  /** Title for the share sheet (Android). */
  title?: string
}

/** Options for the share sheet. */
export interface ShareOptions {
  /** (iOS) Exclude specific activity types. */
  excludedActivityTypes?: string[]
  /** (Android) Dialog title. */
  dialogTitle?: string
}

/** Result of a share attempt. */
export interface ShareResult {
  /** Whether the user completed the share (true) or dismissed (false). */
  shared: boolean
  /** Activity type the user picked (iOS only). */
  activityType?: string
}

/** Options for clipboard write. */
export interface ClipboardWriteOptions {
  /** Whether to show the system "Copied" notification on iOS 16+. Default: true. */
  announce?: boolean
  /** Ask the platform to expire sensitive clipboard content after this many seconds. */
  expiresInSeconds?: number
}
