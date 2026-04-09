import type { ImpactStyle, NotificationType, HapticOptions } from './types'

export type { ImpactStyle, NotificationType, HapticOptions } from './types'

// ── Optional peer dep ─────────────────────────────────────────────────────────

function requireExpoHaptics() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-haptics') as {
      impactAsync(style: string): Promise<void>
      notificationAsync(type: string): Promise<void>
      selectionAsync(): Promise<void>
    }
  } catch {
    throw new Error(
      '[pocketshot] Haptics requires expo-haptics.\nInstall it: npx expo install expo-haptics',
    )
  }
}

// ── Map from semantic names to expo-haptics constants ─────────────────────────

const IMPACT_MAP: Record<ImpactStyle, string> = {
  light: 'light',
  medium: 'medium',
  heavy: 'heavy',
  soft: 'soft',
  rigid: 'rigid',
}

const NOTIFICATION_MAP: Record<NotificationType, string> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
}

// ── Core functions ────────────────────────────────────────────────────────────

/**
 * Triggers an impact haptic feedback (for taps, button presses, drag snaps).
 * No-op if expo-haptics is not installed or if `options.disabled` is true.
 *
 * @param style - Intensity of the impact (default: 'medium')
 */
export function impact(style: ImpactStyle = 'medium', options: HapticOptions = {}): void {
  if (options.disabled) return
  try {
    const Haptics = requireExpoHaptics()
    void Haptics.impactAsync(IMPACT_MAP[style])
  } catch {
    // No-op if haptics unavailable at runtime (e.g. simulator, old device)
  }
}

/**
 * Triggers a notification haptic (for success/warning/error outcomes).
 * No-op if expo-haptics is not installed or if `options.disabled` is true.
 *
 * @param type - Semantic notification type (default: 'success')
 */
export function notification(
  type: NotificationType = 'success',
  options: HapticOptions = {},
): void {
  if (options.disabled) return
  try {
    const Haptics = requireExpoHaptics()
    void Haptics.notificationAsync(NOTIFICATION_MAP[type])
  } catch {
    // No-op
  }
}

/**
 * Triggers a selection haptic (for picker changes, tab switches, list item selection).
 * No-op if expo-haptics is not installed or if `options.disabled` is true.
 */
export function selection(options: HapticOptions = {}): void {
  if (options.disabled) return
  try {
    const Haptics = requireExpoHaptics()
    void Haptics.selectionAsync()
  } catch {
    // No-op
  }
}

/**
 * Convenience object bundling all haptic primitives.
 * Recommended import for components: `import { haptics } from '@lastshotlabs/pocketshot'`
 *
 * @example
 * haptics.impact('light')         // button press
 * haptics.notification('success') // form submitted OK
 * haptics.selection()             // tab changed
 */
export const haptics = {
  impact,
  notification,
  selection,
} as const
