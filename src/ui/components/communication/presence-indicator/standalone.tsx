import React, { useEffect, useMemo, useRef } from 'react'
import { Animated, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export type PresenceStatus = 'online' | 'offline' | 'away' | 'busy' | 'idle'
export type PresenceSize = 'xs' | 'sm' | 'md' | 'lg'

const DOT_SIZES: Record<PresenceSize, number> = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 14,
}

export interface PresenceIndicatorBaseProps {
  /** Presence status. */
  status: PresenceStatus
  /** Indicator size. */
  size?: PresenceSize
  /** Show a text label next to the dot. */
  showLabel?: boolean
  /** Custom label override (defaults to status). */
  label?: string
  /** Show a contrasting border around the dot. */
  bordered?: boolean
  /** Slot overrides for root, dot, label. */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

function resolveStatusColor(status: PresenceStatus, tokens: DesignTokens): string {
  switch (status) {
    case 'online':
      return tokens.colors.success
    case 'offline':
      return tokens.colors.textMuted
    case 'away':
      return tokens.colors.warning
    case 'busy':
      return tokens.colors.error
    case 'idle':
      return tokens.colors.warning + '99'
  }
}

function PulseRing({ diameter, color }: { diameter: number; color: string }) {
  const pulseOpacity = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [pulseOpacity])

  const ringSize = diameter * 2.4

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: ringSize,
        height: ringSize,
        borderRadius: ringSize / 2,
        borderWidth: 1.5,
        borderColor: color,
        opacity: pulseOpacity,
        alignSelf: 'center',
        top: -(ringSize - diameter) / 2,
        left: -(ringSize - diameter) / 2,
      }}
      pointerEvents="none"
    />
  )
}

/**
 * Standalone PresenceIndicator — plain React props, no manifest required.
 *
 * @example
 * <PresenceIndicatorBase status="online" showLabel />
 */
export function PresenceIndicatorBase({
  status,
  size = 'md',
  showLabel = false,
  label,
  bordered = true,
  slots,
  style,
  testID,
  id,
}: PresenceIndicatorBaseProps) {
  const tokens = useTokens()
  const diameter = DOT_SIZES[size]
  const dotColor = resolveStatusColor(status, tokens)
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const rootSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.root })
  const dotSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.dot })
  const labelSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.label })

  const labelText = label ?? status
  const styles = useMemo(
    () => makeStyles(tokens, diameter, bordered, sharedTextStyle, dotColor),
    [tokens, diameter, bordered, sharedTextStyle, dotColor],
  )

  const dot = (
    <View style={[styles.dot, { backgroundColor: dotColor }, dotSurface.style as ViewStyle | undefined]}>
      {status === 'online' && <PulseRing diameter={diameter} color={dotColor} />}
    </View>
  )

  if (showLabel) {
    return (
      <View
        style={[styles.row, rootSurface.style as ViewStyle | undefined, style]}
        accessibilityRole="text"
        accessibilityLabel={`Status: ${labelText}`}
        testID={testID ?? id}
      >
        {dot}
        <Text style={[styles.label, { color: dotColor }, labelSurface.style as TextStyle | undefined]}>
          {labelText}
        </Text>
      </View>
    )
  }

  return (
    <View
      style={[rootSurface.style as ViewStyle | undefined, style]}
      accessibilityRole="image"
      accessibilityLabel={`Status: ${labelText}`}
      testID={testID ?? id}
    >
      {dot}
    </View>
  )
}

function makeStyles(
  tokens: DesignTokens,
  diameter: number,
  bordered: boolean,
  sharedTextStyle: ReturnType<typeof resolveNativeTextStyle>,
  dotColor: string,
) {
  return StyleSheet.create({
    dot: {
      width: diameter,
      height: diameter,
      borderRadius: diameter / 2,
      borderWidth: bordered ? 2 : 0,
      borderColor: tokens.colors.surface,
      overflow: 'visible',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[1],
    },
    label: {
      fontSize:
        typeof sharedTextStyle.fontSize === 'number'
          ? sharedTextStyle.fontSize
          : tokens.typography.fontSizeXs,
      fontWeight:
        typeof sharedTextStyle.fontWeight === 'string'
          ? sharedTextStyle.fontWeight
          : tokens.typography.fontWeightMedium,
      color: typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : dotColor,
      lineHeight:
        typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
      letterSpacing:
        typeof sharedTextStyle.letterSpacing === 'number' ? sharedTextStyle.letterSpacing : undefined,
      textTransform: 'capitalize',
    },
  })
}
