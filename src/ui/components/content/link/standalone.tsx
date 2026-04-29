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

export type LinkSize = 'sm' | 'md' | 'lg'

export interface LinkBaseProps {
  children?: React.ReactNode
  text?: string
  size?: LinkSize
  underline?: boolean
  onPress?: (event: GestureResponderEvent) => void
  style?: TextStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  accessibilityLabel?: string
}

const SIZE_MAP = { sm: 'sm', md: 'base', lg: 'lg' } as const

/**
 * Standalone Link — plain React props, no manifest required.
 *
 * @example
 * <LinkBase onPress={openHelp}>Help</LinkBase>
 */
export function LinkBase({
  children,
  text,
  size = 'md',
  underline = false,
  onPress,
  style,
  slots,
  testID,
  accessibilityLabel,
}: LinkBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const buttonSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.button,
  })
  const textSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: SIZE_MAP[size],
      fontWeight: 'medium',
      color: 'primary',
      textAlign: 'left',
    },
    componentSurface: slots?.text,
  })

  const finalStyle: TextStyle = {
    ...sharedTextStyle,
    textDecorationLine: underline ? 'underline' : 'none',
    ...(textSurface.style as TextStyle | undefined),
    ...style,
  }

  const display = children ?? text ?? ''

  return (
    <TouchableOpacity
      onPress={onPress}
      style={buttonSurface.style as ViewStyle | undefined}
      accessibilityRole="link"
      accessibilityLabel={
        accessibilityLabel ?? (typeof display === 'string' ? display : undefined)
      }
      activeOpacity={0.7}
      testID={testID}
    >
      <Text style={finalStyle}>{display}</Text>
    </TouchableOpacity>
  )
}
