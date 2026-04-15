import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { Animated, Text, TouchableOpacity, View, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { NotificationBellConfig } from './types'

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 }

export function NotificationBell({ config }: { config: NotificationBellConfig }) {
  const tokens = useTokens()
  const { dispatch, values } = useScreenContext()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const rootSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.root as Record<string, unknown> | undefined,
  })
  const buttonSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.button as Record<string, unknown> | undefined,
  })
  const badgeSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.badge as Record<string, unknown> | undefined,
  })

  const resolvedCount = useMemo<number>(() => {
    if (config.count === undefined) return 0
    if (isFromRef(config.count)) {
      const val = resolveFromRef(config.count, values)
      return typeof val === 'number' ? Math.max(0, Math.floor(val)) : 0
    }
    return config.count
  }, [config.count, values])

  const maxCount = config.maxCount ?? 99
  const badgeLabel = resolvedCount > maxCount ? `${maxCount}+` : String(resolvedCount)
  const showBadge = resolvedCount > 0

  const rotate = useRef(new Animated.Value(0)).current
  const prevCountRef = useRef(resolvedCount)

  useEffect(() => {
    const wasZero = prevCountRef.current === 0
    const isNowPositive = resolvedCount > 0
    const increased = resolvedCount > prevCountRef.current

    prevCountRef.current = resolvedCount

    if (config.animated && (wasZero ? isNowPositive : increased)) {
      Animated.sequence([
        Animated.timing(rotate, { toValue: -15, duration: 60, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 15, duration: 80, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -10, duration: 70, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 10, duration: 70, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start()
    }
  }, [resolvedCount, config.animated, rotate])

  const rotateDeg = rotate.interpolate({
    inputRange: [-15, 0, 15],
    outputRange: ['-15deg', '0deg', '15deg'],
  })

  const handlePress = useCallback(async () => {
    if (!config.onPress) return
    await dispatch(config.onPress)
  }, [config.onPress, dispatch])

  const accessibilityLabel = `Notifications${resolvedCount > 0 ? `, ${resolvedCount} unread` : ''}`

  const containerStyle: ViewStyle = {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  }
  const bellStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeXl,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number'
        ? sharedTextStyle.lineHeight
        : tokens.typography.fontSizeXl * 1.4,
    color: typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : undefined,
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
    color:
      typeof sharedTextStyle.color === 'string'
        ? sharedTextStyle.color
        : tokens.colors.errorForeground,
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeXs,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string'
        ? sharedTextStyle.fontWeight
        : tokens.typography.fontWeightBold,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : 13,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={buttonSurface.style as ViewStyle | undefined}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={config.onPress ? 'Tap to view notifications' : undefined}
        testID={config.testID ?? (config.id ? `${config.id}-notification-bell` : 'notification-bell')}
        disabled={!config.onPress}
      >
        <View style={[containerStyle, rootSurface.style as ViewStyle | undefined]}>
          <Animated.Text
            style={[
              bellStyle,
              { transform: [{ rotate: rotateDeg }] },
            ]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            ðŸ””
          </Animated.Text>

          {showBadge ? (
            <View
              style={[
                badgeBaseStyle,
                badgeSurface.style as ViewStyle | undefined,
              ]}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              <Text
                style={[
                  badgeTextStyle,
                ]}
              >
                {badgeLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </ComponentWrapper>
  )
}
