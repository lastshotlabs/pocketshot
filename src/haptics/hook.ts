import { useCallback } from 'react'
import { impact, notification, selection } from './core'
import type { ImpactStyle, NotificationType, HapticOptions } from './types'

/**
 * Returns haptic feedback functions with an optional global disabled override.
 * When `disabled: true` is passed, all haptic calls become no-ops — useful for
 * respecting a user's preference to reduce haptics.
 *
 * @example
 * const haptics = useHaptics({ disabled: !userPrefersHaptics })
 * haptics.impact('light')
 */
export function useHaptics(globalOptions: HapticOptions = {}) {
  const triggerImpact = useCallback(
    (style: ImpactStyle = 'medium', opts: HapticOptions = {}) => {
      impact(style, {
        ...globalOptions,
        ...opts,
        disabled: globalOptions.disabled || opts.disabled,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [globalOptions.disabled],
  )

  const triggerNotification = useCallback(
    (type: NotificationType = 'success', opts: HapticOptions = {}) => {
      notification(type, {
        ...globalOptions,
        ...opts,
        disabled: globalOptions.disabled || opts.disabled,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [globalOptions.disabled],
  )

  const triggerSelection = useCallback(
    (opts: HapticOptions = {}) => {
      selection({ ...globalOptions, ...opts, disabled: globalOptions.disabled || opts.disabled })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [globalOptions.disabled],
  )

  return {
    impact: triggerImpact,
    notification: triggerNotification,
    selection: triggerSelection,
  }
}
