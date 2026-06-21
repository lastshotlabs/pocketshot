import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

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

function triggerHaptic(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Haptics = require('expo-haptics')
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  } catch {
    // no-op
  }
}

export interface BottomTabItem {
  id: string
  label: string
  icon: string
  badge?: number
}

export interface BottomTabBarBaseProps {
  tabs: BottomTabItem[]
  /** Active tab id. */
  activeTab?: string
  /** Default tab when uncontrolled. */
  defaultTab?: string
  /** Whether to elevate with shadow. */
  elevated?: boolean
  /** Show text labels. */
  showLabels?: boolean
  /** Called when active tab changes. */
  onTabChange?: (tabId: string) => void
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone BottomTabBar — plain React props, no manifest required.
 *
 * @example
 * <BottomTabBarBase
 *   tabs={[{ id: 'home', label: 'Home', icon: 'H' }]}
 *   onTabChange={setTab}
 * />
 */
export function BottomTabBarBase({
  tabs,
  activeTab,
  defaultTab,
  elevated = true,
  showLabels = true,
  onTabChange,
  style,
  slots,
  testID,
  id,
}: BottomTabBarBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const bottomInset = useBottomInset()
  const tabCount = tabs.length

  const isControlled = activeTab !== undefined
  const [localActive, setLocalActive] = useState<string>(
    activeTab ?? defaultTab ?? tabs[0]?.id ?? '',
  )
  const current = isControlled ? activeTab : localActive

  useEffect(() => {
    if (isControlled) setLocalActive(activeTab as string)
  }, [activeTab, isControlled])

  const indicatorAnim = useRef(new Animated.Value(0)).current
  const activeIndex = tabs.findIndex((t) => t.id === current)

  useEffect(() => {
    if (activeIndex >= 0) {
      Animated.timing(indicatorAnim, {
        toValue: activeIndex,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [activeIndex, indicatorAnim])

  const rootStyle: ViewStyle = {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surface,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    paddingBottom: bottomInset,
    ...(elevated ? tokens.shadows.md : {}),
  }

  const tabSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingY: 'xs',
      minHeight: 48,
    },
    componentSurface: slots?.tab,
  })
  const iconContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
    componentSurface: slots?.iconContainer,
  })
  const iconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xl',
      color: 'muted',
      states: { selected: { color: 'primary' } },
    },
    componentSurface: slots?.icon,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'muted',
      marginTop: 2,
      states: { selected: { color: 'primary', fontWeight: 'medium' } },
    },
    componentSurface: slots?.label,
  })
  const badgeSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      position: 'absolute',
      minWidth: 16,
      height: 16,
      borderRadius: 'full',
      bg: 'error',
      alignItems: 'center',
      justifyContent: 'center',
      paddingX: 'xs',
    },
    componentSurface: slots?.badge,
  })
  const badgeDotSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: 'full',
      bg: 'error',
    },
    componentSurface: slots?.badgeDot,
  })
  const badgeTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'xs', fontWeight: 'bold', color: 'errorForeground' },
    componentSurface: slots?.badgeText,
  })
  const indicatorSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      position: 'absolute',
      height: 3,
      borderRadius: 'full',
      bg: 'primary',
    },
    componentSurface: slots?.indicator,
  })

  const handleTabPress = (tabId: string) => {
    triggerHaptic()
    if (!isControlled) setLocalActive(tabId)
    onTabChange?.(tabId)
  }

  const idPrefix = testID ?? id

  return (
    <View style={[rootStyle, style]} testID={testID ?? id}>
      <View accessibilityRole="tablist">
        <View style={{ flexDirection: 'row' }}>
          {tabs.map((tab) => {
            const isActive = tab.id === current
            const activeStates: RuntimeSurfaceState[] | undefined = isActive ? ['selected'] : undefined
            const resolvedTabStyle = resolveSurfacePresentation({
              tokens,
              implementationBase: tabSurface.resolvedConfigForWrapper,
              activeStates,
            }).style as ViewStyle | undefined
            const resolvedIconStyle = resolveSurfacePresentation({
              tokens,
              implementationBase: iconSurface.resolvedConfigForWrapper,
              activeStates,
            }).style as TextStyle | undefined
            const resolvedLabelStyle = resolveSurfacePresentation({
              tokens,
              implementationBase: labelSurface.resolvedConfigForWrapper,
              activeStates,
            }).style as TextStyle | undefined

            return (
              <TouchableOpacity
                key={tab.id}
                style={resolvedTabStyle}
                onPress={() => handleTabPress(tab.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab.label}
                accessibilityHint={`Switch to ${tab.label} tab`}
                testID={idPrefix ? `${idPrefix}-${tab.id}` : undefined}
              >
                <View style={iconContainerSurface.style as ViewStyle | undefined}>
                  <Text
                    style={{ ...sharedTextStyle, ...(resolvedIconStyle ?? {}) }}
                    accessibilityElementsHidden
                  >
                    {tab.icon}
                  </Text>
                  {tab.badge != null && tab.badge > 0
                    ? tab.badge === -1
                      ? (
                        <View
                          style={{
                            top: -2,
                            right: -4,
                            ...(badgeDotSurface.style as ViewStyle | undefined),
                          }}
                        />
                      )
                      : (
                        <View
                          style={{
                            top: -4,
                            right: -10,
                            ...(badgeSurface.style as ViewStyle | undefined),
                          }}
                        >
                          <Text
                            style={{
                              ...sharedTextStyle,
                              ...(badgeTextSurface.style as TextStyle | undefined),
                            }}
                          >
                            {tab.badge > 99 ? '99+' : tab.badge}
                          </Text>
                        </View>
                      )
                    : null}
                </View>
                {showLabels ? (
                  <Text
                    style={{ ...sharedTextStyle, ...(resolvedLabelStyle ?? {}) }}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                ) : null}
              </TouchableOpacity>
            )
          })}
        </View>
        {tabCount > 0 ? (
          <Animated.View
            style={[
              {
                width: 24,
                bottom: bottomInset,
                transform: [
                  {
                    translateX: indicatorAnim.interpolate({
                      inputRange: tabs.map((_, i) => i),
                      outputRange: tabs.map((_, i) => {
                        const tabWidth = Dimensions.get('window').width / tabCount
                        return tabWidth * i + (tabWidth - 24) / 2
                      }),
                    }),
                  },
                ],
              },
              indicatorSurface.style as ViewStyle | undefined,
            ]}
            pointerEvents="none"
          />
        ) : null}
      </View>
    </View>
  )
}
