import React from 'react'
import { Text, type TextStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export type LabelSize = 'xs' | 'sm' | 'md'
export type LabelVariant = 'default' | 'muted' | 'error' | 'success'

export interface LabelBaseProps {
  children?: React.ReactNode
  text?: string
  size?: LabelSize
  variant?: LabelVariant
  uppercase?: boolean
  style?: TextStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
}

const SIZE_MAP = { xs: 'xs', sm: 'sm', md: 'base' } as const
const VARIANT_COLOR = {
  default: 'foreground',
  muted: 'muted',
  error: 'error',
  success: 'success',
} as const

/**
 * Standalone Label — plain React props, no manifest required.
 *
 * @example
 * <LabelBase variant="muted" size="xs" uppercase>Section</LabelBase>
 */
export function LabelBase({
  children,
  text,
  size = 'sm',
  variant = 'default',
  uppercase = false,
  style,
  slots,
  testID,
}: LabelBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const textSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: SIZE_MAP[size],
      fontWeight: 'medium',
      color: VARIANT_COLOR[variant],
      textAlign: 'left',
      letterSpacing: uppercase ? 'wide' : undefined,
    },
    componentSurface: slots?.text,
  })

  const finalStyle: TextStyle = {
    ...sharedTextStyle,
    ...(textSurface.style as TextStyle | undefined),
    ...style,
  }

  const display = children ?? text ?? ''
  const rendered = uppercase && typeof display === 'string' ? display.toUpperCase() : display

  return (
    <Text style={finalStyle} accessibilityRole="text" testID={testID}>
      {rendered}
    </Text>
  )
}
