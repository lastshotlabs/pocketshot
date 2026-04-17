import React from 'react'
import { Text, View, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { FormFieldConfig } from './types'

function resolveSlotSurface(
  config: FormFieldConfig,
  tokens: DesignTokens,
  slot: string,
  implementationBase?: Record<string, unknown>,
) {
  return resolveSurfacePresentation({
    tokens,
    implementationBase,
    componentSurface:
      (config.slots as Record<string, Record<string, unknown> | undefined> | undefined)?.[slot],
  })
}

function mergeTextStyle(
  sharedTextStyle: TextStyle,
  surface: ReturnType<typeof resolveSurfacePresentation>,
): TextStyle {
  return {
    ...sharedTextStyle,
    ...(surface.style as TextStyle | undefined),
  }
}

export function FormField({
  config,
  children,
}: {
  config: FormFieldConfig
  children?: React.ReactNode
}) {
  const tokens = useTokens()
  const { getValue, values } = useScreenContext()

  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const label =
    config.label != null ? String(resolveFromRef(config.label, values) ?? '') : undefined
  const helperText =
    config.helperText != null
      ? String(resolveFromRef(config.helperText, values) ?? '')
      : undefined
  const errorText =
    config.errorKey != null ? (getValue(config.errorKey) as string | undefined) : undefined
  const hasError = Boolean(errorText)

  const containerSurface = resolveSlotSurface(config, tokens, 'container', {
    gap: 'xs',
  })
  const labelSurface = resolveSlotSurface(config, tokens, 'label', {
    color: 'foreground',
    fontSize: 'sm',
    fontWeight: 'medium',
  })
  const requiredSurface = resolveSlotSurface(config, tokens, 'required', {
    color: 'error',
  })
  const helperTextSurface = resolveSlotSurface(config, tokens, 'helperText', {
    color: 'muted',
    fontSize: 'xs',
  })
  const errorTextSurface = resolveSlotSurface(config, tokens, 'errorText', {
    color: 'error',
    fontSize: 'xs',
  })

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={containerSurface.style as ViewStyle | undefined}>
        {label != null ? (
          <Text style={mergeTextStyle(sharedTextStyle, labelSurface)} accessibilityRole="text">
            {label}
            {config.required ? (
              <Text style={mergeTextStyle(sharedTextStyle, requiredSurface)} accessibilityLabel="required">
                {' *'}
              </Text>
            ) : null}
          </Text>
        ) : null}

        {children}

        {hasError && errorText ? (
          <Text
            style={mergeTextStyle(sharedTextStyle, errorTextSurface)}
            accessibilityRole="text"
            accessibilityLiveRegion="polite"
          >
            {errorText}
          </Text>
        ) : helperText != null ? (
          <Text style={mergeTextStyle(sharedTextStyle, helperTextSurface)} accessibilityRole="text">
            {helperText}
          </Text>
        ) : null}
      </View>
    </ComponentWrapper>
  )
}
