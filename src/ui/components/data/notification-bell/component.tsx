import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { NotificationBellConfig } from './types'

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 }

// ── NotificationBell ───────────────────────────────────────────────────────────

export function NotificationBell({ config }: { config: NotificationBellConfig }) {
  const tokens = useTokens()
  const { dispatch, values } = useScreenContext()
  const styles = makeStyles(tokens)

  // Resolve count
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

  // Jiggle animation
  const rotate = useRef(new Animated.Value(0)).current
  const prevCountRef = useRef(resolvedCount)

  useEffect(() => {
    const wasZero = prevCountRef.current === 0
    const isNowPositive = resolvedCount > 0
    const increased = resolvedCount > prevCountRef.current

    prevCountRef.current = resolvedCount

    if (config.animated && (wasZero ? isNowPositive : increased)) {
      // Jiggle: -15 → 15 → -10 → 10 → 0 degrees
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

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={config.onPress ? 'Tap to view notifications' : undefined}
        testID={config.testID ?? (config.id ? `${config.id}-notification-bell` : 'notification-bell')}
        disabled={!config.onPress}
      >
        <View style={styles.container}>
          <Animated.Text
            style={[styles.bell, { transform: [{ rotate: rotateDeg }] }]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            🔔
          </Animated.Text>

          {showBadge ? (
            <View
              style={[
                styles.badge,
                badgeLabel.length > 2 ? styles.badgeWide : undefined,
              ]}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </ComponentWrapper>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      width: 36,
      height: 36,
    },
    bell: {
      fontSize: tokens.typography.fontSizeXl,
      lineHeight: tokens.typography.fontSizeXl * 1.4,
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 18,
      height: 18,
      borderRadius: tokens.radius.full,
      backgroundColor: tokens.colors.error,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeWide: {
      paddingHorizontal: 5,
    },
    badgeText: {
      color: tokens.colors.errorForeground,
      fontSize: tokens.typography.fontSizeXs,
      fontWeight: tokens.typography.fontWeightBold,
      lineHeight: 13,
    },
  })
}

