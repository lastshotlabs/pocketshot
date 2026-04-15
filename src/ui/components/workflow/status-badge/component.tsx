import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens, ColorTokens } from '../../../tokens/types'
import type { StatusBadgeConfig, StatusColor, ResolvedStatus } from './types'

// Default status → display mappings
const DEFAULT_STATUS_MAP: Record<string, { label: string; color: StatusColor }> = {
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
  customMap: StatusBadgeConfig['statusMap'],
): ResolvedStatus {
  const merged = { ...DEFAULT_STATUS_MAP, ...customMap }
  const lower = rawStatus.toLowerCase()
  const found = merged[lower] ?? merged[rawStatus]
  if (found) return found
  // Fallback: capitalize status as label, default color
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

export function StatusBadge({ config }: { config: StatusBadgeConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const rawStatus = isFromRef(config.status)
    ? String(resolveFromRef(config.status, values) ?? 'unknown')
    : config.status

  const resolved = resolveStatus(rawStatus, config.statusMap)
  const colorPair = resolveColorPair(resolved.color, tokens.colors)
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const rootSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.root as Record<string, unknown> | undefined,
  })
  const dotSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.dot as Record<string, unknown> | undefined,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
  })

  // Pulsing dot animation
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!config.showDot) return

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true, // opacity — native driver ok
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [config.showDot, pulseAnim])

  const styles = makeStyles(tokens, config.size ?? 'md', colorPair, sharedTextStyle)

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View
        style={[styles.container, rootSurface.style]}
        accessibilityLabel={`Status: ${resolved.label}`}
      >
        {config.showDot ? (
          <Animated.View style={[styles.dot, { opacity: pulseAnim }, dotSurface.style]} />
        ) : null}
        <Text style={[styles.label, labelSurface.style]} numberOfLines={1}>
          {resolved.label}
        </Text>
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(
  tokens: DesignTokens,
  size: NonNullable<StatusBadgeConfig['size']>,
  colorPair: { background: string; foreground: string },
  sharedTextStyle: ReturnType<typeof resolveNativeTextStyle>,
) {
  const isSm = size === 'sm'
  const paddingH = isSm ? 6 : 10
  const paddingV = isSm ? 2 : 4
  const fontSize =
    typeof sharedTextStyle.fontSize === 'number'
      ? sharedTextStyle.fontSize
      : isSm
        ? tokens.typography.fontSizeXs
        : tokens.typography.fontSizeSm
  const dotSize = isSm ? 6 : 8
  const foreground =
    typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : colorPair.foreground

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
      backgroundColor: foreground,
    },
    label: {
      fontSize,
      color: foreground,
      fontWeight:
        typeof sharedTextStyle.fontWeight === 'string'
          ? sharedTextStyle.fontWeight
          : tokens.typography.fontWeightSemibold,
      lineHeight:
        typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
      letterSpacing:
        typeof sharedTextStyle.letterSpacing === 'number'
          ? sharedTextStyle.letterSpacing
          : undefined,
    },
  })
}

