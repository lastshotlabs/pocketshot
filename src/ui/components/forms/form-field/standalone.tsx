import React from 'react'
import { Text, View, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export interface FormFieldBaseProps {
  /** Field label rendered above children. */
  label?: string
  /** Marks the field as required (renders red asterisk after label). */
  required?: boolean
  /** Helper text shown beneath children when no error is present. */
  helperText?: string
  /** Error message — when set, replaces helper text and signals invalid state. */
  errorText?: string
  /** Slot overrides (container, label, required, helperText, errorText). */
  slots?: Record<string, Record<string, unknown>>
  /** Style applied to root container. */
  style?: ViewStyle
  testID?: string
  id?: string
  /** Children — typically the field input. */
  children?: React.ReactNode
}

/**
 * Standalone FormField — wraps a field with label, helper, and error text.
 *
 * @example
 * <FormFieldBase label="Email" helperText="We'll never share it" required>
 *   <TextInputBase value={email} onChangeText={setEmail} />
 * </FormFieldBase>
 */
export function FormFieldBase({
  label,
  required,
  helperText,
  errorText,
  slots,
  style,
  testID,
  id,
  children,
}: FormFieldBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const hasError = Boolean(errorText)

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { gap: 'xs' },
    componentSurface: slots?.container,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      color: 'foreground',
      fontSize: 'sm',
      fontWeight: 'medium',
    },
    componentSurface: slots?.label,
  })
  const requiredSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { color: 'error' },
    componentSurface: slots?.required,
  })
  const helperTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { color: 'muted', fontSize: 'xs' },
    componentSurface: slots?.helperText,
  })
  const errorTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { color: 'error', fontSize: 'xs' },
    componentSurface: slots?.errorText,
  })

  function mergeText(surface: ReturnType<typeof resolveSurfacePresentation>): TextStyle {
    return { ...sharedTextStyle, ...(surface.style as TextStyle | undefined) }
  }

  return (
    <View style={[containerSurface.style as ViewStyle | undefined, style]} testID={testID ?? id}>
      {label != null ? (
        <Text style={mergeText(labelSurface)} accessibilityRole="text">
          {label}
          {required ? (
            <Text style={mergeText(requiredSurface)} accessibilityLabel="required">
              {' *'}
            </Text>
          ) : null}
        </Text>
      ) : null}

      {children}

      {hasError && errorText ? (
        <Text
          style={mergeText(errorTextSurface)}
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
        >
          {errorText}
        </Text>
      ) : helperText != null ? (
        <Text style={mergeText(helperTextSurface)} accessibilityRole="text">
          {helperText}
        </Text>
      ) : null}
    </View>
  )
}
