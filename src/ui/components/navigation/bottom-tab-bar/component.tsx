import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, Text, TouchableOpacity, View, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { BottomTabBarConfig } from './types'

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

export function BottomTabBar({ config }: { config: BottomTabBarConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()
  const bottomInset = useBottomInset()
  const elevated = config.elevated ?? true
  const showLabels = config.showLabels ?? true
  const tabCount = config.tabs.length
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const resolvedActiveTab =
    config.activeTab != null
      ? (resolveFromRef(config.activeTab, values) as string | undefined)
      : undefined

  const defaultTab = config.tabs[0]?.id ?? ''
  const [localActive, setLocalActive] = useState<string>(resolvedActiveTab ?? defaultTab)
  const activeTab = resolvedActiveTab ?? localActive

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

  useEffect(() => {
    if (resolvedActiveTab != null) {
      setLocalActive(resolvedActiveTab)
    }
  }, [resolvedActiveTab])

  useEffect(() => {
    setValue(config.id, activeTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const baseTextStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : undefined,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string' ? sharedTextStyle.fontWeight : undefined,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
    opacity: typeof sharedTextStyle.opacity === 'number' ? sharedTextStyle.opacity : undefined,
  }

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
    componentSurface: config.slots?.tab as Record<string, unknown> | undefined,
  })
  const iconContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    componentSurface: config.slots?.iconContainer as Record<string, unknown> | undefined,
  })
  const iconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xl',
      color: 'muted',
      states: {
        selected: {
          color: 'primary',
        },
      },
    },
    componentSurface: config.slots?.icon as Record<string, unknown> | undefined,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'muted',
      marginTop: 2,
      states: {
        selected: {
          color: 'primary',
          fontWeight: 'medium',
        },
      },
    },
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.badge as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.badgeDot as Record<string, unknown> | undefined,
  })
  const badgeTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      fontWeight: 'bold',
      color: 'errorForeground',
    },
    componentSurface: config.slots?.badgeText as Record<string, unknown> | undefined,
  })
  const indicatorSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      position: 'absolute',
      height: 3,
      borderRadius: 'full',
      bg: 'primary',
    },
    componentSurface: config.slots?.indicator as Record<string, unknown> | undefined,
  })

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

  const idPrefix = config.testID ?? config.id

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config} style={rootStyle}>
      <View accessibilityRole="tablist">
        <View style={{ flexDirection: 'row' }}>
          {config.tabs.map((tab, index) => {
            const isActive = tab.id === activeTab
            const resolvedBadge =
              tab.badge != null
                ? (resolveFromRef(tab.badge, values) as number | undefined)
                : undefined
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
                onPress={() => handleTabPress(tab.id, index)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab.label}
                accessibilityHint={`Switch to ${tab.label} tab`}
                testID={`${idPrefix}-${tab.id}`}
              >
                <View style={iconContainerSurface.style as ViewStyle | undefined}>
                  <Text
                    style={{
                      ...baseTextStyle,
                      ...(resolvedIconStyle ?? {}),
                    }}
                    accessibilityElementsHidden
                  >
                    {tab.icon}
                  </Text>
                  {resolvedBadge != null && resolvedBadge > 0
                    ? resolvedBadge === -1
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
                              ...baseTextStyle,
                              ...(badgeTextSurface.style as TextStyle | undefined),
                            }}
                          >
                            {resolvedBadge > 99 ? '99+' : resolvedBadge}
                          </Text>
                        </View>
                      )
                    : null}
                </View>
                {showLabels ? (
                  <Text
                    style={{
                      ...baseTextStyle,
                      ...(resolvedLabelStyle ?? {}),
                    }}
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
                      inputRange: config.tabs.map((_, i) => i),
                      outputRange: config.tabs.map((_, i) => {
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
    </ComponentWrapper>
  )
}
