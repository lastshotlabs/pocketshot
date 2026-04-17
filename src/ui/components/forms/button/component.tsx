import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { View, Text, TouchableOpacity, Animated, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { ButtonConfig } from './types'

type Variant = NonNullable<ButtonConfig['variant']>
type Size = NonNullable<ButtonConfig['size']>

function variantBase(variant: Variant) {
  switch (variant) {
    case 'primary':
      return { bg: 'primary', color: 'primaryForeground' }
    case 'secondary':
      return { bg: 'card', color: 'foreground', border: '1px solid border' }
    case 'ghost':
      return { bg: 'transparent', color: 'primary' }
    case 'outline':
      return { bg: 'transparent', color: 'primary', border: '1px solid primary' }
    case 'destructive':
      return { bg: 'destructive', color: 'destructiveForeground' }
  }
}

const SIZE_BASE: Record<Size, { paddingY: 'sm' | 'md' | 'lg'; paddingX: 'sm' | 'md' | 'lg'; fontSize: 'sm' | 'base' | 'lg' }> = {
  sm: { paddingY: 'sm', paddingX: 'sm', fontSize: 'sm' },
  md: { paddingY: 'md', paddingX: 'md', fontSize: 'base' },
  lg: { paddingY: 'lg', paddingX: 'lg', fontSize: 'lg' },
}

function LoadingIndicator({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 500, useNativeDriver: true }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {Array.from({ length: 3 }).map((_, index) => (
        <Animated.View
          key={index}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
            marginHorizontal: 2,
            opacity,
          }}
        />
      ))}
    </View>
  )
}

export function Button({ config }: { config: ButtonConfig }) {
  const tokens = useTokens()
  const { dispatch, values } = useScreenContext()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const resolvedLabel = isFromRef(config.label)
    ? String(resolveFromRef(config.label, values) ?? '')
    : config.label
  const resolvedLoading = isFromRef(config.loading)
    ? Boolean(resolveFromRef(config.loading, values))
    : Boolean(config.loading)
  const resolvedDisabled = isFromRef(config.disabled)
    ? Boolean(resolveFromRef(config.disabled, values))
    : Boolean(config.disabled)

  const variant = config.variant ?? 'primary'
  const size = config.size ?? 'md'
  const fullWidth = config.fullWidth ?? false
  const activeStates: RuntimeSurfaceState[] | undefined =
    resolvedDisabled || resolvedLoading ? ['disabled'] : undefined

  const variantTokens = useMemo(() => variantBase(variant), [variant])
  const buttonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'md',
      shadow: variantTokens.bg !== 'transparent' ? 'sm' : undefined,
      alignSelf: fullWidth ? 'stretch' : 'start',
      opacity: resolvedDisabled || resolvedLoading ? 0.5 : 1,
      ...SIZE_BASE[size],
      ...variantTokens,
    },
    componentSurface: config.slots?.button as Record<string, unknown> | undefined,
    activeStates,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: SIZE_BASE[size].fontSize,
      fontWeight: 'semibold',
      color: variantTokens.color,
    },
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
    activeStates,
  })
  const iconLeftSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: SIZE_BASE[size].fontSize,
      color: variantTokens.color,
      marginRight: 'xs',
    },
    componentSurface: config.slots?.iconLeft as Record<string, unknown> | undefined,
    activeStates,
  })
  const iconRightSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: SIZE_BASE[size].fontSize,
      color: variantTokens.color,
      marginLeft: 'xs',
    },
    componentSurface: config.slots?.iconRight as Record<string, unknown> | undefined,
    activeStates,
  })
  const loadingSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    componentSurface: config.slots?.loading as Record<string, unknown> | undefined,
    activeStates,
  })

  const textBase: TextStyle = {
    ...sharedTextStyle,
  }

  const handlePress = useCallback(async () => {
    if (resolvedDisabled || resolvedLoading) return
    await dispatch({ type: 'haptic', style: 'light' })
    await dispatch(config.onPress)
  }, [config.onPress, dispatch, resolvedDisabled, resolvedLoading])

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={activeStates}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.75}
        disabled={resolvedDisabled || resolvedLoading}
        accessibilityRole="button"
        accessibilityLabel={resolvedLabel}
        accessibilityState={{ disabled: resolvedDisabled || resolvedLoading, busy: resolvedLoading }}
        testID={config.testID ? `${config.testID}-button` : undefined}
      >
        <View style={buttonSurface.style as ViewStyle | undefined}>
          {resolvedLoading ? (
            <View style={loadingSurface.style as ViewStyle | undefined}>
              <LoadingIndicator color={tokens.colors[variantTokens.color as keyof typeof tokens.colors] ?? tokens.colors.primaryForeground} />
            </View>
          ) : (
            <>
              {config.iconLeft ? (
                <Text
                  style={{
                    ...textBase,
                    ...(iconLeftSurface.style as TextStyle | undefined),
                  }}
                  accessibilityElementsHidden
                >
                  {config.iconLeft}
                </Text>
              ) : null}
              <Text
                style={{
                  ...textBase,
                  ...(labelSurface.style as TextStyle | undefined),
                }}
              >
                {resolvedLabel}
              </Text>
              {config.iconRight ? (
                <Text
                  style={{
                    ...textBase,
                    ...(iconRightSurface.style as TextStyle | undefined),
                  }}
                  accessibilityElementsHidden
                >
                  {config.iconRight}
                </Text>
              ) : null}
            </>
          )}
        </View>
      </TouchableOpacity>
    </ComponentWrapper>
  )
}
