import React from 'react'
import {
  Text,
  TouchableOpacity,
  type GestureResponderEvent,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export interface BackButtonBaseProps {
  /** Visible label text. */
  label?: string
  /** Press handler. */
  onPress?: (event: GestureResponderEvent) => void
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone BackButton — plain React props, no manifest required.
 *
 * @example
 * <BackButtonBase label="Back" onPress={() => navigation.goBack()} />
 */
export function BackButtonBase({
  label = 'Back',
  onPress,
  style,
  slots,
  testID,
  id,
}: BackButtonBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const buttonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 'xs',
      paddingY: 'xs',
      paddingX: 'xs',
      alignSelf: 'start',
    },
    componentSurface: slots?.button,
  })
  const iconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'lg', color: 'primary' },
    componentSurface: slots?.icon,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', fontWeight: 'medium', color: 'primary' },
    componentSurface: slots?.label,
  })

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[buttonSurface.style as ViewStyle | undefined, style]}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityHint="Navigate to the previous screen"
      testID={testID ?? id ?? 'back-button'}
    >
      <Text
        style={{ ...sharedTextStyle, ...(iconSurface.style as TextStyle | undefined) }}
        accessibilityElementsHidden
      >
        {'<'}
      </Text>
      <Text style={{ ...sharedTextStyle, ...(labelSurface.style as TextStyle | undefined) }}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}
