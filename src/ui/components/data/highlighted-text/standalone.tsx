import React, { useMemo } from 'react'
import { Text, type TextStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export interface HighlightedTextBaseProps {
  /** The full text to render. */
  text: string
  /** A single highlight phrase. */
  highlight?: string
  /** Multiple highlight phrases. */
  highlights?: string[]
  /** Background color for highlight (token key or hex). */
  highlightColor?: string
  /** Foreground color for highlight (token key or hex). */
  highlightForeground?: string
  /** When true, match case-sensitively. */
  caseSensitive?: boolean
  /** Slot overrides (mark). */
  slots?: Record<string, Record<string, unknown>>
  style?: TextStyle
  testID?: string
  id?: string
}

interface Segment {
  text: string
  highlighted: boolean
}

function segmentText(text: string, highlights: string[], caseSensitive: boolean): Segment[] {
  if (!highlights.length || !text) {
    return [{ text, highlighted: false }]
  }

  const escaped = highlights
    .filter((h) => h.length > 0)
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

  if (!escaped.length) {
    return [{ text, highlighted: false }]
  }

  const pattern = new RegExp(`(${escaped.join('|')})`, caseSensitive ? 'g' : 'gi')
  const parts = text.split(pattern)
  const highlightSet = new Set(highlights.map((h) => (caseSensitive ? h : h.toLowerCase())))

  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      highlighted: highlightSet.has(caseSensitive ? part : part.toLowerCase()),
    }))
}

function resolveColor(
  colorKey: string | undefined,
  fallback: string,
  tokens: DesignTokens,
): string {
  if (!colorKey) return fallback
  const tokenColor = (tokens.colors as unknown as Record<string, string>)[colorKey]
  return tokenColor ?? colorKey
}

/**
 * Standalone HighlightedText — plain React props, no manifest required.
 *
 * @example
 * <HighlightedTextBase text="Hello World" highlight="World" />
 */
export function HighlightedTextBase({
  text,
  highlight,
  highlights,
  highlightColor,
  highlightForeground,
  caseSensitive,
  slots,
  style,
  testID,
}: HighlightedTextBaseProps) {
  const tokens = useTokens()

  const highlightTerms = highlight ? [highlight, ...(highlights ?? [])] : (highlights ?? [])

  const baseTextStyle = useMemo(() => {
    const resolved = resolveNativeTextStyle({}, tokens)
    const fontSize =
      typeof resolved.fontSize === 'number' ? resolved.fontSize : tokens.typography.fontSizeMd
    return {
      color: tokens.colors.text,
      fontSize,
      lineHeight: fontSize * tokens.typography.lineHeightNormal,
      ...resolved,
      ...style,
    } as TextStyle
  }, [tokens, style])

  const markSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.mark })
  const highlightBg = useMemo(
    () => resolveColor(highlightColor, tokens.colors.warning, tokens),
    [highlightColor, tokens],
  )
  const highlightFg = useMemo(
    () => resolveColor(highlightForeground, tokens.colors.text, tokens),
    [highlightForeground, tokens],
  )
  const segments = useMemo(
    () => segmentText(text, highlightTerms, caseSensitive === true),
    [text, highlightTerms, caseSensitive],
  )

  return (
    <Text style={baseTextStyle} accessibilityRole="text" accessibilityLabel={text} testID={testID}>
      {segments.map((segment, index) =>
        segment.highlighted ? (
          <Text
            key={index}
            style={[
              baseTextStyle,
              { backgroundColor: highlightBg, color: highlightFg },
              markSurface.style as TextStyle | undefined,
            ]}
          >
            {segment.text}
          </Text>
        ) : (
          <Text key={index} style={baseTextStyle}>
            {segment.text}
          </Text>
        ),
      )}
    </Text>
  )
}
