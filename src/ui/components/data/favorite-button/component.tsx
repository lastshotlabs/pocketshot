import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, TouchableOpacity } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { FavoriteButtonConfig } from './types'

// ── Size map ───────────────────────────────────────────────────────────────────

const FONT_SIZE: Record<'sm' | 'md' | 'lg', number> = {
  sm: 20,
  md: 28,
  lg: 36,
}

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 }

// ── FavoriteButton ─────────────────────────────────────────────────────────────

export function FavoriteButton({ config }: { config: FavoriteButtonConfig }) {
  const tokens = useTokens()
  const { dispatch, setValue, values } = useScreenContext()

  // Resolve controlled value from ref or direct boolean
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

  // Sync if controlled value changes
  useEffect(() => {
    if (controlledValue !== undefined) {
      setActive(controlledValue)
    }
  }, [controlledValue])

  // Animation refs
  const scale = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(1)).current

  const handlePress = useCallback(async () => {
    const nextActive = !active

    // Scale bounce animation
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

    // Opacity flicker when going inactive
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

  // Resolve colors
  const activeColor =
    config.activeColor !== undefined
      ? config.activeColor
      : config.variant === 'heart'
        ? tokens.colors.error
        : tokens.colors.warning

  const inactiveColor = tokens.colors.textMuted

  // Icon characters
  const icon =
    config.variant === 'heart' ? (active ? '♥' : '♡') : active ? '★' : '☆'

  const fontSize = FONT_SIZE[config.size ?? 'md']

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={1}
        hitSlop={HIT_SLOP}
        accessibilityRole="togglebutton"
        accessibilityLabel={`${config.variant ?? 'heart'} button${active ? ', active' : ''}`}
        accessibilityState={{ checked: active }}
        testID={config.testID ?? (config.id ? `${config.id}-favorite-button` : 'favorite-button')}
      >
        <Animated.Text
          style={{
            fontSize,
            color: active ? activeColor : inactiveColor,
            transform: [{ scale }],
            opacity,
            lineHeight: fontSize * 1.2,
          }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {icon}
        </Animated.Text>
      </TouchableOpacity>
    </ComponentWrapper>
  )
}

