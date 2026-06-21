import React, { useEffect, useRef, useState } from 'react'
import { Animated, Text, View, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export type SaveIndicatorStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface SaveIndicatorBaseProps {
  /** Current status. */
  status?: SaveIndicatorStatus
  /** Override label for the saving state. */
  savingLabel?: string
  /** Override label for the saved state. */
  savedLabel?: string
  /** Override label for the error state. */
  errorLabel?: string
  /** Slot overrides (icon, label). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

function SavingPulse({ tokens, style }: { tokens: DesignTokens; style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: tokens.radius.full,
          backgroundColor: tokens.colors.textMuted,
          marginRight: tokens.spacing[2],
          opacity,
        },
        style,
      ]}
    />
  )
}

/**
 * Standalone SaveIndicator — plain React props, no manifest required.
 *
 * @example
 * <SaveIndicatorBase status="saving" />
 */
export function SaveIndicatorBase({
  status = 'idle',
  savingLabel = 'Saving…',
  savedLabel = 'Saved',
  errorLabel = 'Error saving',
  slots,
  style,
  testID,
}: SaveIndicatorBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [displayStatus, setDisplayStatus] = useState<SaveIndicatorStatus>('idle')
  const fadeAnim = useRef(new Animated.Value(0)).current
  const autoFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const iconSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.icon })
  const labelSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.label })

  useEffect(() => {
    if (status === displayStatus) return

    if (autoFadeTimer.current) {
      clearTimeout(autoFadeTimer.current)
      autoFadeTimer.current = null
    }

    if (status === 'idle') {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
        setDisplayStatus('idle'),
      )
      return
    }

    setDisplayStatus(status)
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start()

    if (status === 'saved') {
      autoFadeTimer.current = setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
          setDisplayStatus('idle'),
        )
      }, 2000)
    }
  }, [status, displayStatus, fadeAnim])

  useEffect(() => {
    return () => {
      if (autoFadeTimer.current) clearTimeout(autoFadeTimer.current)
    }
  }, [])

  if (displayStatus === 'idle') {
    return <View testID={testID} />
  }

  const rowStyle: ViewStyle = { flexDirection: 'row', alignItems: 'center', ...style }
  const iconStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeSm,
    marginRight: tokens.spacing[1],
    color: tokens.colors.textMuted,
  }
  const labelStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeSm,
    color: tokens.colors.textMuted,
  }
  const statusColor =
    displayStatus === 'saved'
      ? tokens.colors.success
      : displayStatus === 'error'
        ? tokens.colors.error
        : tokens.colors.textMuted

  return (
    <Animated.View
      style={[rowStyle, { opacity: fadeAnim }]}
      accessibilityRole="text"
      accessibilityLabel={
        displayStatus === 'saving'
          ? savingLabel
          : displayStatus === 'saved'
            ? savedLabel
            : errorLabel
      }
      testID={testID}
    >
      {displayStatus === 'saving' ? (
        <>
          <SavingPulse tokens={tokens} />
          <Text
            style={[
              labelStyle,
              { color: statusColor },
              labelSurface.style as TextStyle | undefined,
            ]}
          >
            {savingLabel}
          </Text>
        </>
      ) : displayStatus === 'saved' ? (
        <>
          <Text
            style={[iconStyle, { color: statusColor }, iconSurface.style as TextStyle | undefined]}
          >
            ✓
          </Text>
          <Text
            style={[
              labelStyle,
              { color: statusColor },
              labelSurface.style as TextStyle | undefined,
            ]}
          >
            {savedLabel}
          </Text>
        </>
      ) : (
        <>
          <Text
            style={[iconStyle, { color: statusColor }, iconSurface.style as TextStyle | undefined]}
          >
            ✕
          </Text>
          <Text
            style={[
              labelStyle,
              { color: statusColor },
              labelSurface.style as TextStyle | undefined,
            ]}
          >
            {errorLabel}
          </Text>
        </>
      )}
    </Animated.View>
  )
}
