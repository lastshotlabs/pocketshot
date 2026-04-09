/** Haptic impact style — maps to expo-haptics ImpactFeedbackStyle */
export type ImpactStyle = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid'

/** Haptic notification type — maps to expo-haptics NotificationFeedbackType */
export type NotificationType = 'success' | 'warning' | 'error'

/** Options for haptic calls */
export interface HapticOptions {
  /** If true, skip the haptic even if available. Useful for programmatic suppression. */
  disabled?: boolean
}
