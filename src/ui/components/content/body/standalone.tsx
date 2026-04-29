import React from 'react'
import { Text, type TextStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export interface BodyBaseProps {
  /** Body text. */
  children?: React.ReactNode
  /** Alias for children when passing a string. */
  text?: string
  /** Truncate to N lines. */
  numberOfLines?: number
  /** Style applied to the underlying Text. */
  style?: TextStyle
  /** Slot overrides (text). */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
}

/**
 * Standalone Body — plain React props, no manifest required.
 *
 * @example
 * <BodyBase>Some paragraph text</BodyBase>
 */
export function BodyBase({
  children,
  text,
  numberOfLines,
  style,
  slots,
  testID,
}: BodyBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const textSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      fontWeight: 'normal',
      color: 'foreground',
      textAlign: 'left',
      lineHeight: 'normal',
    },
    componentSurface: slots?.text,
  })

  const finalStyle: TextStyle = {
    ...sharedTextStyle,
    ...(textSurface.style as TextStyle | undefined),
    ...style,
  }

  return (
    <Text
      style={finalStyle}
      numberOfLines={numberOfLines}
      accessibilityRole="text"
      testID={testID}
    >
      {children ?? text}
    </Text>
  )
}
