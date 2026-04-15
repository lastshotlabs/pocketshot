import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { ButtonConfig } from './types'

type Variant = NonNullable<ButtonConfig['variant']>
type Size = NonNullable<ButtonConfig['size']>

function resolveVariantStyle(
  variant: Variant,
  tokens: DesignTokens,
): { backgroundColor: string; textColor: string; borderColor?: string; borderWidth?: number } {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: tokens.colors.primary,
        textColor: tokens.colors.primaryForeground,
      }
    case 'secondary':
      return {
        backgroundColor: tokens.colors.surface,
        textColor: tokens.colors.text,
        borderColor: tokens.colors.border,
        borderWidth: 1,
      }
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        textColor: tokens.colors.primary,
      }
    case 'outline':
      return {
        backgroundColor: 'transparent',
        textColor: tokens.colors.primary,
        borderColor: tokens.colors.primary,
        borderWidth: 1,
      }
    case 'destructive':
      return {
        backgroundColor: tokens.colors.destructive,
        textColor: tokens.colors.destructiveForeground,
      }
  }
}

const SIZE_STYLES: Record<Size, { paddingVertical: number; paddingHorizontal: number }> = {
  sm: { paddingVertical: 8, paddingHorizontal: 12 },
  md: { paddingVertical: 12, paddingHorizontal: 16 },
  lg: { paddingVertical: 16, paddingHorizontal: 20 },
}

const SIZE_FONT_SIZE: Record<Size, keyof DesignTokens['typography']> = {
  sm: 'fontSizeSm',
  md: 'fontSizeMd',
  lg: 'fontSizeLg',
}

function makeStyles(
  tokens: DesignTokens,
  variantStyle: ReturnType<typeof resolveVariantStyle>,
  size: Size,
  fullWidth: boolean,
  isDisabled: boolean,
) {
  const sizeStyle = SIZE_STYLES[size]
  const fontSize = tokens.typography[SIZE_FONT_SIZE[size]] as number

  return StyleSheet.create({
    touchable: {
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
      opacity: isDisabled ? 0.5 : 1,
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: sizeStyle.paddingVertical,
      paddingHorizontal: sizeStyle.paddingHorizontal,
      borderRadius: tokens.radius.md,
      backgroundColor: variantStyle.backgroundColor,
      ...(variantStyle.borderColor
        ? { borderColor: variantStyle.borderColor, borderWidth: variantStyle.borderWidth ?? 1 }
        : {}),
      ...(variantStyle.backgroundColor !== 'transparent'
        ? tokens.shadows.sm
        : {}),
    },
    label: {
      fontSize,
      color: variantStyle.textColor,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
    iconLeft: {
      fontSize,
      color: variantStyle.textColor,
      marginRight: tokens.spacing[2],
    },
    iconRight: {
      fontSize,
      color: variantStyle.textColor,
      marginLeft: tokens.spacing[2],
    },
    loadingDot: {
      width: 8,
      height: 8,
      borderRadius: tokens.radius.full,
      backgroundColor: variantStyle.textColor,
      marginHorizontal: tokens.spacing[1],
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  })
}

function LoadingIndicator({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Animated.View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: color,
          marginHorizontal: 2,
          opacity,
        }}
      />
      <Animated.View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: color,
          marginHorizontal: 2,
          opacity,
        }}
      />
      <Animated.View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: color,
          marginHorizontal: 2,
          opacity,
        }}
      />
    </View>
  )
}

export function Button({ config }: { config: ButtonConfig }) {
  const tokens = useTokens()
  const { dispatch, values } = useScreenContext()

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

  const variantStyle = useMemo(
    () => resolveVariantStyle(variant, tokens),
    [variant, tokens],
  )

  const styles = useMemo(
    () => makeStyles(tokens, variantStyle, size, fullWidth, resolvedDisabled || resolvedLoading),
    [tokens, variantStyle, size, fullWidth, resolvedDisabled, resolvedLoading],
  )

  const handlePress = useCallback(async () => {
    if (resolvedDisabled || resolvedLoading) return
    await dispatch({ type: 'haptic', style: 'light' })
    await dispatch(config.onPress)
  }, [resolvedDisabled, resolvedLoading, dispatch, config.onPress])

  const isInteractable = !resolvedDisabled && !resolvedLoading

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={resolvedDisabled || resolvedLoading ? ['disabled'] : undefined}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.75}
        disabled={!isInteractable}
        style={styles.touchable}
        accessibilityRole="button"
        accessibilityLabel={resolvedLabel}
        accessibilityState={{ disabled: resolvedDisabled || resolvedLoading, busy: resolvedLoading }}
        testID={config.testID ? `${config.testID}-button` : undefined}
      >
        <View style={styles.container}>
          {resolvedLoading ? (
            <LoadingIndicator color={variantStyle.textColor} />
          ) : (
            <>
              {config.iconLeft ? (
                <Text style={styles.iconLeft} accessibilityElementsHidden>
                  {config.iconLeft}
                </Text>
              ) : null}
              <Text style={styles.label}>{resolvedLabel}</Text>
              {config.iconRight ? (
                <Text style={styles.iconRight} accessibilityElementsHidden>
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
