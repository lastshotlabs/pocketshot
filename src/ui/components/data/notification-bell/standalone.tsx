import React, { useEffect, useRef } from 'react'
import {
  Animated,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export interface NotificationBellBaseProps {
  /** Unread count. */
  count?: number
  /** Maximum count to show numerically before showing "N+". */
  maxCount?: number
  /** Animate the bell when count increases. */
  animated?: boolean
  /** Press handler. */
  onPress?: () => void
  /** Slot overrides (root, button, badge). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 }

/**
 * Standalone NotificationBell — plain React props, no manifest required.
 *
 * @example
 * <NotificationBellBase count={3} onPress={() => navigate('inbox')} />
 */
export function NotificationBellBase({
  count = 0,
  maxCount = 99,
  animated = false,
  onPress,
  slots,
  style,
  testID,
  id,
}: NotificationBellBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const rootSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.root })
  const buttonSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.button })
  const badgeSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.badge })

  const safeCount = Math.max(0, Math.floor(count))
  const badgeLabel = safeCount > maxCount ? `${maxCount}+` : String(safeCount)
  const showBadge = safeCount > 0

  const rotate = useRef(new Animated.Value(0)).current
  const prevCountRef = useRef(safeCount)

  useEffect(() => {
    const wasZero = prevCountRef.current === 0
    const isNowPositive = safeCount > 0
    const increased = safeCount > prevCountRef.current

    prevCountRef.current = safeCount

    if (animated && (wasZero ? isNowPositive : increased)) {
      Animated.sequence([
        Animated.timing(rotate, { toValue: -15, duration: 60, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 15, duration: 80, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -10, duration: 70, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 10, duration: 70, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start()
    }
  }, [safeCount, animated, rotate])

  const rotateDeg = rotate.interpolate({
    inputRange: [-15, 0, 15],
    outputRange: ['-15deg', '0deg', '15deg'],
  })

  const accessibilityLabel = `Notifications${safeCount > 0 ? `, ${safeCount} unread` : ''}`

  const containerStyle: ViewStyle = {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    ...style,
  }
  const bellStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeXl,
    lineHeight: tokens.typography.fontSizeXl * 1.4,
  }
  const badgeBaseStyle: ViewStyle = {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: badgeLabel.length > 2 ? 5 : 3,
  }
  const badgeTextStyle: TextStyle = {
    ...sharedTextStyle,
    color: tokens.colors.errorForeground,
    fontSize: tokens.typography.fontSizeXs,
    fontWeight: tokens.typography.fontWeightBold,
    lineHeight: 13,
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={buttonSurface.style as ViewStyle | undefined}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={onPress ? 'Tap to view notifications' : undefined}
      testID={testID ?? (id ? `${id}-notification-bell` : 'notification-bell')}
      disabled={!onPress}
    >
      <View style={[containerStyle, rootSurface.style as ViewStyle | undefined]}>
        <Animated.Text
          style={[bellStyle, { transform: [{ rotate: rotateDeg }] }]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          🔔
        </Animated.Text>

        {showBadge ? (
          <View
            style={[badgeBaseStyle, badgeSurface.style as ViewStyle | undefined]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            <Text style={badgeTextStyle}>{badgeLabel}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}
