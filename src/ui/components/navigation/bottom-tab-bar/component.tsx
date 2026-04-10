import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { BottomTabBarConfig } from './types'

// ── Safe area ──────────────────────────────────────────────────────────────────

function useBottomInset(): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useSafeAreaInsets } =
      require('react-native-safe-area-context') as typeof import('react-native-safe-area-context')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSafeAreaInsets().bottom
  } catch {
    return 34
  }
}

// ── Haptic helper ──────────────────────────────────────────────────────────────

function triggerHaptic(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Haptics = require('expo-haptics')
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  } catch {
    // expo-haptics not available — silent no-op
  }
}

// ── Styles ─────────────────────────────────────────────────────────────────────

function makeStyles(
  tokens: DesignTokens,
  bottomInset: number,
  elevated: boolean,
  tabCount: number,
) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: tokens.colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.colors.border,
      paddingBottom: bottomInset,
      ...(elevated && tokens.shadows.md),
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[2],
      minHeight: 48,
    },
    iconContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      fontSize: tokens.typography.fontSizeXl,
    },
    label: {
      fontSize: tokens.typography.fontSizeXs,
      marginTop: 2,
    },
    activeColor: {
      color: tokens.colors.primary,
    },
    inactiveColor: {
      color: tokens.colors.textMuted,
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -10,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: tokens.colors.error,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeDot: {
      position: 'absolute',
      top: -2,
      right: -4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: tokens.colors.error,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: tokens.typography.fontWeightBold,
      color: tokens.colors.errorForeground,
    },
    indicator: {
      position: 'absolute',
      bottom: bottomInset,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: tokens.colors.primary,
    },
  })
}

// ── Public component ───────────────────────────────────────────────────────────

/**
 * Config-driven bottom tab bar. Fixed at the bottom with safe area inset.
 *
 * Features:
 * - Icon + label per tab with active/inactive states
 * - Animated sliding indicator (pill) under active tab
 * - Badge dots or numeric badges on tab icons
 * - Haptic feedback on tab press
 * - Publishes active tab id to ScreenContext
 */
export function BottomTabBar({ config }: { config: BottomTabBarConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()
  const bottomInset = useBottomInset()
  const elevated = config.elevated ?? true
  const showLabels = config.showLabels ?? true
  const tabCount = config.tabs.length

  const resolvedActiveTab =
    config.activeTab != null
      ? (resolveFromRef(config.activeTab, values) as string | undefined)
      : undefined

  const defaultTab = config.tabs[0]?.id ?? ''
  const [localActive, setLocalActive] = useState<string>(resolvedActiveTab ?? defaultTab)
  const activeTab = resolvedActiveTab ?? localActive

  // Animated indicator position
  const indicatorAnim = useRef(new Animated.Value(0)).current
  const activeIndex = config.tabs.findIndex((t) => t.id === activeTab)

  useEffect(() => {
    if (activeIndex >= 0) {
      Animated.timing(indicatorAnim, {
        toValue: activeIndex,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [activeIndex, indicatorAnim])

  // Sync from context if controlled
  useEffect(() => {
    if (resolvedActiveTab != null) {
      setLocalActive(resolvedActiveTab)
    }
  }, [resolvedActiveTab])

  // Publish initial value
  useEffect(() => {
    setValue(config.id, activeTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTabPress = useCallback(
    (tabId: string, tabIndex: number) => {
      triggerHaptic()
      setLocalActive(tabId)
      setValue(config.id, tabId)

      const tab = config.tabs[tabIndex]
      if (tab?.onPress) {
        void dispatch(tab.onPress)
      }
    },
    [config.id, config.tabs, dispatch, setValue],
  )

  const styles = useMemo(
    () => makeStyles(tokens, bottomInset, elevated, tabCount),
    [tokens, bottomInset, elevated, tabCount],
  )

  const idPrefix = config.testID ?? config.id

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.container} accessibilityRole="tablist">
        {config.tabs.map((tab, index) => {
          const isActive = tab.id === activeTab
          const resolvedBadge =
            tab.badge != null
              ? (resolveFromRef(tab.badge, values) as number | undefined)
              : undefined

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => handleTabPress(tab.id, index)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              accessibilityHint={`Switch to ${tab.label} tab`}
              testID={`${idPrefix}-${tab.id}`}
            >
              <View style={styles.iconContainer}>
                <Text
                  style={[styles.icon, isActive ? styles.activeColor : styles.inactiveColor]}
                  accessibilityElementsHidden
                >
                  {tab.icon}
                </Text>
                {resolvedBadge != null && resolvedBadge > 0 && (
                  resolvedBadge === -1 ? (
                    <View style={styles.badgeDot} />
                  ) : (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {resolvedBadge > 99 ? '99+' : resolvedBadge}
                      </Text>
                    </View>
                  )
                )}
              </View>
              {showLabels && (
                <Text
                  style={[styles.label, isActive ? styles.activeColor : styles.inactiveColor]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              )}
            </TouchableOpacity>
          )
        })}

        {/* Animated indicator */}
        {tabCount > 0 && (
          <Animated.View
            style={[
              styles.indicator,
              {
                width: 24,
                transform: [
                  {
                    translateX: indicatorAnim.interpolate({
                      inputRange: config.tabs.map((_, i) => i),
                      outputRange: config.tabs.map((_, i) => {
                        const tabWidth = Dimensions.get('window').width / tabCount
                        return tabWidth * i + (tabWidth - 24) / 2
                      }),
                    }),
                  },
                ],
              },
            ]}
            pointerEvents="none"
          />
        )}
      </View>
    </ComponentWrapper>
  )
}
