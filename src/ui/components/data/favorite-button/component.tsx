import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, TouchableOpacity, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { FavoriteButtonConfig } from './types'

const FONT_SIZE: Record<'sm' | 'md' | 'lg', number> = {
  sm: 20,
  md: 28,
  lg: 36,
}

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 }

export function FavoriteButton({ config }: { config: FavoriteButtonConfig }) {
  const tokens = useTokens()
  const { dispatch, setValue, values } = useScreenContext()

  let controlledValue: boolean | undefined
  if (config.value !== undefined) {
    if (isFromRef(config.value)) {
      controlledValue = resolveFromRef(config.value as unknown as boolean, values) as
        | boolean
        | undefined
    } else {
      controlledValue = config.value as unknown as boolean
    }
  }

  const [active, setActive] = useState<boolean>(
    controlledValue !== undefined ? controlledValue : (config.defaultValue ?? false),
  )

  useEffect(() => {
    if (controlledValue !== undefined) {
      setActive(controlledValue)
    }
  }, [controlledValue])

  const scale = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(1)).current
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const rootSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.root as Record<string, unknown> | undefined,
  })
  const iconSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.icon as Record<string, unknown> | undefined,
  })

  const handlePress = useCallback(async () => {
    const nextActive = !active

    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.4,
        useNativeDriver: true,
        speed: 40,
        bounciness: 12,
      }),
      Animated.spring(scale, {
        toValue: 1.0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 6,
      }),
    ]).start()

    if (!nextActive) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.4, duration: 80, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1.0, duration: 120, useNativeDriver: true }),
      ]).start()
    }

    setActive(nextActive)

    if (config.id) setValue(config.id, nextActive)

    if (config.onToggleAction) {
      await dispatch(config.onToggleAction)
    }
  }, [active, config.id, config.onToggleAction, dispatch, opacity, scale, setValue])

  const activeColor =
    config.activeColor !== undefined
      ? config.activeColor
      : config.variant === 'heart'
        ? tokens.colors.error
        : tokens.colors.warning

  const inactiveColor = tokens.colors.textMuted
  const icon =
    config.variant === 'heart' ? (active ? '♥' : '♡') : active ? '★' : '☆'
  const fontSize = FONT_SIZE[config.size ?? 'md']

  const iconStyle: TextStyle = {
    fontSize: typeof sharedTextStyle.fontSize === 'number' ? sharedTextStyle.fontSize : fontSize,
    color:
      typeof sharedTextStyle.color === 'string'
        ? sharedTextStyle.color
        : active
          ? activeColor
          : inactiveColor,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string' ? sharedTextStyle.fontWeight : undefined,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number'
        ? sharedTextStyle.lineHeight
        : fontSize * 1.2,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={1}
        style={rootSurface.style as ViewStyle | undefined}
        hitSlop={HIT_SLOP}
        accessibilityRole="togglebutton"
        accessibilityLabel={`${config.variant ?? 'heart'} button${active ? ', active' : ''}`}
        accessibilityState={{ checked: active }}
        testID={config.testID ?? (config.id ? `${config.id}-favorite-button` : 'favorite-button')}
      >
        <Animated.Text
          style={[
            iconStyle,
            {
              transform: [{ scale }],
              opacity,
            },
            iconSurface.style as TextStyle | undefined,
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {icon}
        </Animated.Text>
      </TouchableOpacity>
    </ComponentWrapper>
  )
}
