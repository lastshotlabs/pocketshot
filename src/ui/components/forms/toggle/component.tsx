import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Animated, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { ToggleConfig } from './types'

function sizeSurface(size: ToggleConfig['size']) {
  switch (size) {
    case 'sm':
      return { paddingY: 'xs', paddingX: 'sm', fontSize: 'sm' }
    case 'lg':
      return { paddingY: 'md', paddingX: 'lg', fontSize: 'lg' }
    case 'md':
    default:
      return { paddingY: 'sm', paddingX: 'md', fontSize: 'base' }
  }
}

export function Toggle({ config }: { config: ToggleConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const resolvedValue =
    config.value != null ? (resolveFromRef(config.value, values) as boolean | undefined) : undefined
  const resolvedDisabled =
    config.disabled != null
      ? (resolveFromRef(config.disabled, values) as boolean | undefined)
      : undefined
  const resolvedLabel =
    config.label != null
      ? isFromRef(config.label)
        ? (resolveFromRef(config.label, values) as unknown as string | undefined)
        : config.label
      : undefined

  const [active, setActive] = useState<boolean>(resolvedValue ?? config.defaultValue ?? false)
  const scaleAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (resolvedValue != null) {
      setActive(resolvedValue)
    }
  }, [resolvedValue])

  const disabled = resolvedDisabled ?? false
  const activeStates: RuntimeSurfaceState[] | undefined = disabled
    ? ['disabled']
    : active
      ? ['selected']
      : undefined

  const variantSurface =
    active
      ? config.variant === 'primary'
        ? { bg: 'primary', color: 'primary-foreground', border: '0px solid transparent' }
        : config.variant === 'outline'
          ? { bg: 'transparent', color: 'primary', border: '1px solid primary' }
          : { bg: 'card', color: 'foreground', border: '2px solid primary' }
      : { bg: 'popover', color: 'muted', border: '1px solid border' }

  const buttonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 'xs',
      borderRadius: 'md',
      opacity: disabled ? 0.4 : 1,
      ...sizeSurface(config.size),
      ...variantSurface,
    },
    componentSurface: config.slots?.button as Record<string, unknown> | undefined,
    activeStates,
  })
  const iconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: sizeSurface(config.size).fontSize,
      color:
        active && config.variant === 'primary'
          ? 'primary-foreground'
          : active && config.variant === 'outline'
            ? 'primary'
            : active
              ? 'foreground'
              : 'muted',
    },
    componentSurface: config.slots?.icon as Record<string, unknown> | undefined,
    activeStates,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: sizeSurface(config.size).fontSize,
      fontWeight: 'medium',
      color:
        active && config.variant === 'primary'
          ? 'primary-foreground'
          : active && config.variant === 'outline'
            ? 'primary'
            : active
              ? 'foreground'
              : 'muted',
    },
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
    activeStates,
  })

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

  const handlePress = useCallback(() => {
    if (disabled) return
    const newValue = !active
    setActive(newValue)
    setValue(config.id, newValue)
    if (config.onChangeAction) {
      void dispatch(config.onChangeAction)
    }
  }, [active, config.id, config.onChangeAction, disabled, dispatch, setValue])

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start()
  }, [scaleAnim])

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start()
  }, [scaleAnim])

  const accessibilityLabel =
    resolvedLabel ?? config.icon ?? (active ? 'Active toggle' : 'Inactive toggle')

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config} activeStates={activeStates}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignSelf: 'flex-start' }}>
        <TouchableOpacity
          style={buttonSurface.style as ViewStyle | undefined}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          accessibilityRole="togglebutton"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ checked: active, disabled }}
          accessibilityHint={active ? 'Tap to deactivate' : 'Tap to activate'}
          testID={config.testID ?? config.id}
        >
          {config.icon != null ? (
            <Text
              style={{
                ...baseTextStyle,
                ...(iconSurface.style as TextStyle | undefined),
              }}
            >
              {config.icon}
            </Text>
          ) : null}
          {resolvedLabel != null ? (
            <Text
              style={{
                ...baseTextStyle,
                ...(labelSurface.style as TextStyle | undefined),
              }}
            >
              {resolvedLabel}
            </Text>
          ) : null}
        </TouchableOpacity>
      </Animated.View>
    </ComponentWrapper>
  )
}
