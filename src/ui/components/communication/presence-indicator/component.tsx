import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { PresenceIndicatorConfig, PresenceStatus, PresenceSize } from './types'

// ── Constants ─────────────────────────────────────────────────────────────────

const DOT_SIZES: Record<PresenceSize, number> = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 14,
}

// ── Color resolution ──────────────────────────────────────────────────────────

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
      // warning at 60% opacity — blend using hex alpha
      return tokens.colors.warning + '99'
  }
}

// ── Pulse ring (online only) ──────────────────────────────────────────────────

function PulseRing({
  diameter,
  color,
}: {
  diameter: number
  color: string
}) {
  const pulseOpacity = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0.5,
          duration: 0,
          useNativeDriver: true,
        }),
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

// ── PresenceIndicator ─────────────────────────────────────────────────────────

export function PresenceIndicator({ config }: { config: PresenceIndicatorConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const status = resolveFromRef(config.status, values) as PresenceStatus
  const diameter = DOT_SIZES[config.size]
  const dotColor = resolveStatusColor(status, tokens)

  const labelText = config.label ?? status
  const styles = useMemo(() => makeStyles(tokens, diameter, config.bordered), [tokens, diameter, config.bordered])

  const dot = (
    <View style={[styles.dot, { backgroundColor: dotColor }]}>
      {status === 'online' && <PulseRing diameter={diameter} color={dotColor} />}
    </View>
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      {config.showLabel ? (
        <View
          style={styles.row}
          accessibilityRole="text"
          accessibilityLabel={`Status: ${labelText}`}
          testID={config.testID}
        >
          {dot}
          <Text style={[styles.label, { color: dotColor }]}>{labelText}</Text>
        </View>
      ) : (
        <View
          accessibilityRole="image"
          accessibilityLabel={`Status: ${labelText}`}
          testID={config.testID}
        >
          {dot}
        </View>
      )}
    </ComponentWrapper>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(tokens: DesignTokens, diameter: number, bordered: boolean) {
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
      fontSize: tokens.typography.fontSizeXs,
      fontWeight: tokens.typography.fontWeightMedium,
      textTransform: 'capitalize',
    },
  })
}
