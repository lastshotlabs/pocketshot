import React from 'react'
import { Text, type TextStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface HeadingBaseProps {
  /** Heading text. */
  children?: React.ReactNode
  /** Alias for children when passing a string. */
  text?: string
  /** Semantic level (1-6). Determines default size & weight. */
  level?: HeadingLevel
  /** Style applied to the underlying Text. */
  style?: TextStyle
  /** Slot overrides (text). */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
}

const LEVEL_SURFACES = {
  1: { fontSize: '4xl', fontWeight: 'bold' },
  2: { fontSize: '3xl', fontWeight: 'bold' },
  3: { fontSize: '2xl', fontWeight: 'semibold' },
  4: { fontSize: 'xl', fontWeight: 'semibold' },
  5: { fontSize: 'lg', fontWeight: 'medium' },
  6: { fontSize: 'base', fontWeight: 'medium' },
} as const

/**
 * Standalone Heading — plain React props, no manifest required.
 *
 * @example
 * <HeadingBase level={2}>Section title</HeadingBase>
 */
export function HeadingBase({ children, text, level = 2, style, slots, testID }: HeadingBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const textSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      ...LEVEL_SURFACES[level],
      color: 'foreground',
      textAlign: 'left',
      lineHeight: 'tight',
    },
    componentSurface: slots?.text,
  })

  const finalStyle: TextStyle = {
    ...sharedTextStyle,
    ...(textSurface.style as TextStyle | undefined),
    ...style,
  }

  return (
    <Text style={finalStyle} accessibilityRole="header" testID={testID}>
      {children ?? text}
    </Text>
  )
}
