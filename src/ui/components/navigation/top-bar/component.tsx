import React, { useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { Action } from '../../../actions/types'
import type { TopBarConfig } from './types'

// ── Safe area ──────────────────────────────────────────────────────────────────

function useTopInset(): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useSafeAreaInsets } =
      require('react-native-safe-area-context') as typeof import('react-native-safe-area-context')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSafeAreaInsets().top
  } catch {
    return 44
  }
}

// ── Icon map ──────────────────────────────────────────────────────────────────

const PRESET_ICONS: Record<string, { icon: string; label: string }> = {
  back: { icon: '←', label: 'Go back' },
  menu: { icon: '☰', label: 'Open menu' },
  close: { icon: '✕', label: 'Close' },
}

// ── Styles ─────────────────────────────────────────────────────────────────────

function makeStyles(
  tokens: DesignTokens,
  topInset: number,
  transparent: boolean,
  elevated: boolean,
) {
  return StyleSheet.create({
    wrapper: {
      backgroundColor: transparent ? 'transparent' : tokens.colors.surface,
      borderBottomWidth: transparent ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: tokens.colors.border,
      paddingTop: topInset,
      ...(transparent && { position: 'absolute', top: 0, left: 0, right: 0, zIndex: tokens.zIndex.sticky }),
      ...(elevated && !transparent && tokens.shadows.md),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      minHeight: 48,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 48,
    },
    center: {
      flex: 1,
      alignItems: 'center',
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      minWidth: 48,
      gap: tokens.spacing[1],
    },
    iconButton: {
      padding: tokens.spacing[2],
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: {
      fontSize: tokens.typography.fontSizeLg,
      color: transparent ? tokens.colors.textInverse : tokens.colors.primary,
    },
    title: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: transparent ? tokens.colors.textInverse : tokens.colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: tokens.typography.fontSizeXs,
      color: transparent ? tokens.colors.textInverse : tokens.colors.textMuted,
      textAlign: 'center',
      marginTop: 1,
    },
    badgeContainer: {
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: 0,
      right: 0,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: tokens.colors.error,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: tokens.typography.fontWeightBold,
      color: tokens.colors.errorForeground,
    },
  })
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface ActionButtonProps {
  icon: string
  label: string
  onPress: () => void
  badge?: number
  testID: string
  styles: ReturnType<typeof makeStyles>
}

function ActionButton({ icon, label, onPress, badge, testID, styles }: ActionButtonProps) {
  return (
    <View style={styles.badgeContainer}>
      <TouchableOpacity
        onPress={onPress}
        style={styles.iconButton}
        accessibilityLabel={label}
        accessibilityRole="button"
        testID={testID}
      >
        <Text style={styles.iconText}>{icon}</Text>
      </TouchableOpacity>
      {badge != null && badge > 0 && (
        <View style={styles.badge} accessibilityLabel={`${badge} notifications`}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  )
}

// ── Public component ───────────────────────────────────────────────────────────

/**
 * Config-driven navigation header bar. Handles safe area top inset automatically.
 *
 * Left area: back / menu / close preset or custom icon with action
 * Center: title (supports from-ref) + optional subtitle
 * Right area: up to 3 action icons with optional badge counts
 *
 * Supports transparent mode (absolute positioned, no background) and
 * elevated mode (shadow/elevation).
 */
export function TopBar({ config }: { config: TopBarConfig }) {
  const tokens = useTokens()
  const { dispatch, values } = useScreenContext()
  const topInset = useTopInset()

  const transparent = config.transparent ?? false
  const elevated = config.elevated ?? true

  const styles = useMemo(
    () => makeStyles(tokens, topInset, transparent, elevated),
    [tokens, topInset, transparent, elevated],
  )

  const resolvedTitle = resolveFromRef(config.title, values) as string | undefined
  const idPrefix = config.testID ?? config.id ?? 'top-bar'

  // ── Left action handler ──────────────────────────────────────────────────
  function renderLeftAction() {
    if (config.leftAction == null) return null

    if (typeof config.leftAction === 'string') {
      const preset = PRESET_ICONS[config.leftAction]
      if (!preset) return null

      const handlePress = () => {
        if (config.leftAction === 'back') {
          void dispatch({ type: 'navigate', path: '..' })
        } else if (config.leftAction === 'menu') {
          void dispatch({ type: 'set-value', key: '__drawerMenu', value: true })
        } else if (config.leftAction === 'close') {
          void dispatch({ type: 'navigate', path: '..' })
        }
      }

      return (
        <ActionButton
          icon={preset.icon}
          label={preset.label}
          onPress={handlePress}
          testID={`${idPrefix}-left-${config.leftAction}`}
          styles={styles}
        />
      )
    }

    // Custom left action
    const customAction = config.leftAction as { icon: string; onPress: Action }
    return (
      <ActionButton
        icon={customAction.icon}
        label="Action"
        onPress={() => void dispatch(customAction.onPress)}
        testID={`${idPrefix}-left-custom`}
        styles={styles}
      />
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.wrapper} accessibilityRole="header">
        <View style={styles.row}>
          {/* Left */}
          <View style={styles.left}>{renderLeftAction()}</View>

          {/* Center */}
          <View style={styles.center}>
            <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
              {resolvedTitle ?? ''}
            </Text>
            {config.subtitle != null && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {config.subtitle}
              </Text>
            )}
          </View>

          {/* Right */}
          <View style={styles.right}>
            {(config.rightActions ?? []).map((ra, index) => (
              <ActionButton
                key={index}
                icon={ra.icon}
                label={`Action ${index + 1}`}
                onPress={() => void dispatch(ra.onPress)}
                badge={ra.badge}
                testID={`${idPrefix}-right-action-${index}`}
                styles={styles}
              />
            ))}
          </View>
        </View>
      </View>
    </ComponentWrapper>
  )
}
