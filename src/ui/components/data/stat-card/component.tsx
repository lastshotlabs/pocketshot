import React, { useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { StatCardConfig } from './types'

export function StatCard({ config }: { config: StatCardConfig }) {
  const tokens = useTokens()
  const { dispatch, values } = useScreenContext()
  const styles = makeStyles(tokens)

  const resolvedValue = isFromRef(config.value)
    ? String(resolveFromRef(config.value, values) ?? '')
    : String(config.value)

  const handlePress = useCallback(async () => {
    if (!config.onPress) return
    await dispatch(config.onPress)
  }, [config.onPress, dispatch])

  const trendColor =
    config.trend?.direction === 'up'
      ? tokens.colors.success
      : config.trend?.direction === 'down'
        ? tokens.colors.error
        : tokens.colors.textMuted

  const trendIcon =
    config.trend?.direction === 'up' ? '↑' : config.trend?.direction === 'down' ? '↓' : '→'

  const inner = (
    <View style={styles.card}>
      <View style={styles.header}>
        {config.icon ? (
          <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">
            {config.icon}
          </Text>
        ) : null}
        <Text style={styles.label}>{config.label}</Text>
      </View>
      <Text style={styles.value} accessibilityLabel={`${config.label}: ${resolvedValue}`}>
        {resolvedValue}
      </Text>
      {config.trend ? (
        <View style={styles.trendRow}>
          <Text style={[styles.trendText, { color: trendColor }]}>
            {trendIcon} {config.trend.value}
          </Text>
        </View>
      ) : null}
    </View>
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      {config.onPress ? (
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={`${config.label} stat card`}
          accessibilityHint="Tap to view details"
        >
          {inner}
        </TouchableOpacity>
      ) : (
        inner
      )}
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.lg,
      padding: tokens.spacing[4],
      ...tokens.shadows.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: tokens.spacing[1],
    },
    icon: {
      fontSize: tokens.typography.fontSizeLg,
      marginRight: tokens.spacing[2],
    },
    label: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      fontWeight: tokens.typography.fontWeightMedium,
      flexShrink: 1,
    },
    value: {
      fontSize: tokens.typography.fontSize3xl,
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightBold,
      marginBottom: tokens.spacing[1],
    },
    trendRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    trendText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
    },
  })
}
