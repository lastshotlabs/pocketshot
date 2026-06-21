import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { ColorTokens, DesignTokens } from '../../../tokens/types'

export type StatusColor = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default'
export type StatusBadgeSize = 'sm' | 'md'

export interface ResolvedStatus {
  label: string
  color: StatusColor
}

const DEFAULT_STATUS_MAP: Record<string, ResolvedStatus> = {
  active: { label: 'Active', color: 'success' },
  enabled: { label: 'Enabled', color: 'success' },
  live: { label: 'Live', color: 'success' },
  pending: { label: 'Pending', color: 'warning' },
  processing: { label: 'Processing', color: 'warning' },
  loading: { label: 'Loading', color: 'warning' },
  error: { label: 'Error', color: 'error' },
  failed: { label: 'Failed', color: 'error' },
  rejected: { label: 'Rejected', color: 'error' },
  inactive: { label: 'Inactive', color: 'default' },
  disabled: { label: 'Disabled', color: 'default' },
  archived: { label: 'Archived', color: 'default' },
  draft: { label: 'Draft', color: 'info' },
  scheduled: { label: 'Scheduled', color: 'info' },
}

function resolveStatus(
  rawStatus: string,
  customMap?: Record<string, ResolvedStatus>,
): ResolvedStatus {
  const merged = { ...DEFAULT_STATUS_MAP, ...customMap }
  const lower = rawStatus.toLowerCase()
  const found = merged[lower] ?? merged[rawStatus]
  if (found) return found
  return {
    label: rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1),
    color: 'default',
  }
}

function resolveColorPair(
  color: StatusColor,
  colors: ColorTokens,
): { background: string; foreground: string } {
  switch (color) {
    case 'primary':
      return { background: colors.primary, foreground: colors.primaryForeground }
    case 'success':
      return { background: colors.success, foreground: colors.successForeground }
    case 'warning':
      return { background: colors.warning, foreground: colors.warningForeground }
    case 'error':
      return { background: colors.error, foreground: colors.errorForeground }
    case 'info':
      return { background: colors.info, foreground: colors.infoForeground }
    case 'default':
    default:
      return { background: colors.badgeBackground, foreground: colors.badgeForeground }
  }
}

export interface StatusBadgeBaseProps {
  /** Raw status string. */
  status: string
  /** Custom status map override. */
  statusMap?: Record<string, ResolvedStatus>
  size?: StatusBadgeSize
  /** Show pulsing dot. */
  showDot?: boolean
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone StatusBadge — plain React props, no manifest required.
 *
 * @example
 * <StatusBadgeBase status="active" showDot />
 */
export function StatusBadgeBase({
  status,
  statusMap,
  size = 'md',
  showDot,
  style,
  slots,
  testID,
  id,
}: StatusBadgeBaseProps) {
  const tokens = useTokens()
  const resolved = resolveStatus(status, statusMap)
  const colorPair = resolveColorPair(resolved.color, tokens.colors)
  const rootSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.root })
  const dotSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.dot })
  const labelSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.label })

  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!showDot) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [showDot, pulseAnim])

  const styles = makeStyles(tokens, size, colorPair)

  return (
    <View
      style={[styles.container, rootSurface.style as ViewStyle | undefined, style]}
      accessibilityLabel={`Status: ${resolved.label}`}
      testID={testID ?? id}
    >
      {showDot ? (
        <Animated.View
          style={[styles.dot, { opacity: pulseAnim }, dotSurface.style as ViewStyle | undefined]}
        />
      ) : null}
      <Text style={[styles.label, labelSurface.style as ViewStyle | undefined]} numberOfLines={1}>
        {resolved.label}
      </Text>
    </View>
  )
}

function makeStyles(
  tokens: DesignTokens,
  size: StatusBadgeSize,
  colorPair: { background: string; foreground: string },
) {
  const isSm = size === 'sm'
  const paddingH = isSm ? 6 : 10
  const paddingV = isSm ? 2 : 4
  const fontSize = isSm ? tokens.typography.fontSizeXs : tokens.typography.fontSizeSm
  const dotSize = isSm ? 6 : 8

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: colorPair.background,
      borderRadius: tokens.radius.full,
      paddingHorizontal: paddingH,
      paddingVertical: paddingV,
      gap: isSm ? 4 : 6,
    },
    dot: {
      width: dotSize,
      height: dotSize,
      borderRadius: dotSize / 2,
      backgroundColor: colorPair.foreground,
    },
    label: {
      fontSize,
      color: colorPair.foreground,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
  })
}
