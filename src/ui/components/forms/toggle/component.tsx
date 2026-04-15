import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { ToggleConfig } from './types'

export function Toggle({ config }: { config: ToggleConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

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

  const [active, setActive] = useState<boolean>(resolvedValue ?? config.defaultValue)

  const scaleAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (resolvedValue != null) {
      setActive(resolvedValue)
    }
  }, [resolvedValue])

  const disabled = resolvedDisabled ?? false

  const handlePress = useCallback(() => {
    if (disabled) return
    const newValue = !active
    setActive(newValue)
    setValue(config.id, newValue)
    if (config.onChangeAction) {
      void dispatch(config.onChangeAction)
    }
  }, [active, disabled, config.id, config.onChangeAction, setValue, dispatch])

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

  const styles = useMemo(
    () => makeStyles(tokens, config.variant, config.size, active, disabled),
    [tokens, config.variant, config.size, active, disabled],
  )

  const accessibilityLabel =
    resolvedLabel ?? config.icon ?? (active ? 'Active toggle' : 'Inactive toggle')

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignSelf: 'flex-start' }}>
        <TouchableOpacity
          style={styles.button}
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
          {config.icon != null && <Text style={styles.icon}>{config.icon}</Text>}
          {resolvedLabel != null && <Text style={styles.label}>{resolvedLabel}</Text>}
        </TouchableOpacity>
      </Animated.View>
    </ComponentWrapper>
  )
}

function makeStyles(
  tokens: DesignTokens,
  variant: ToggleConfig['variant'],
  size: ToggleConfig['size'],
  active: boolean,
  disabled: boolean,
) {
  const sizeStyles = {
    sm: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      fontSize: tokens.typography.fontSizeSm,
    },
    md: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      fontSize: tokens.typography.fontSizeMd,
    },
    lg: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      fontSize: tokens.typography.fontSizeLg,
    },
  }[size ?? 'md']

  let backgroundColor: string
  let textColor: string
  let borderColor: string
  let borderWidth: number

  if (!active) {
    // All variants share the same inactive appearance
    backgroundColor = tokens.colors.surfaceAlt
    textColor = tokens.colors.textMuted
    borderColor = tokens.colors.border
    borderWidth = 1
  } else {
    switch (variant) {
      case 'primary':
        backgroundColor = tokens.colors.primary
        textColor = tokens.colors.primaryForeground
        borderColor = tokens.colors.primary
        borderWidth = 0
        break
      case 'outline':
        backgroundColor = 'transparent'
        textColor = tokens.colors.primary
        borderColor = tokens.colors.primary
        borderWidth = 1
        break
      default:
        // 'default'
        backgroundColor = tokens.colors.surface
        textColor = tokens.colors.text
        borderColor = tokens.colors.primary
        borderWidth = 2
        break
    }
  }

  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[1],
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      backgroundColor,
      borderColor,
      borderWidth,
      borderRadius: tokens.radius.md,
      opacity: disabled ? 0.4 : 1,
    },
    icon: {
      fontSize: sizeStyles.fontSize,
      color: textColor,
    },
    label: {
      fontSize: sizeStyles.fontSize,
      fontWeight: tokens.typography.fontWeightMedium,
      color: textColor,
    },
  })
}

