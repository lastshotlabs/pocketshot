import React, { useMemo } from 'react'
import { Text, type TextStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { HighlightedTextConfig } from './types'

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
  const highlightSet = new Set(
    highlights.map((h) => (caseSensitive ? h : h.toLowerCase())),
  )

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
  tokens: ReturnType<typeof useTokens>,
): string {
  if (!colorKey) return fallback
  const tokenColor = (tokens.colors as unknown as Record<string, string>)[colorKey]
  return tokenColor ?? colorKey
}

export function HighlightedText({ config }: { config: HighlightedTextConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const resolvedText = isFromRef(config.text)
    ? String(resolveFromRef(config.text, values) ?? '')
    : config.text
  const resolvedHighlight = isFromRef(config.highlight)
    ? String(resolveFromRef(config.highlight, values) ?? '')
    : config.highlight
  const resolvedHighlights = isFromRef(config.highlights)
    ? ((resolveFromRef(config.highlights, values) as unknown as string[]) ?? [])
    : (config.highlights as string[] | undefined) ?? []
  const highlightTerms = resolvedHighlight
    ? [resolvedHighlight, ...resolvedHighlights]
    : resolvedHighlights
  const baseTextStyle = useMemo(() => {
    const resolved = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
    const fontSize =
      typeof resolved.fontSize === 'number' ? resolved.fontSize : tokens.typography.fontSizeMd

    return {
      color: tokens.colors.text,
      fontSize,
      lineHeight: fontSize * tokens.typography.lineHeightNormal,
      ...resolved,
    } as TextStyle
  }, [config, tokens])

  const markSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.mark as Record<string, unknown> | undefined,
  })
  const highlightBg = useMemo(
    () => resolveColor(config.highlightColor, tokens.colors.warning, tokens),
    [config.highlightColor, tokens],
  )
  const highlightFg = useMemo(
    () => resolveColor(config.highlightForeground, tokens.colors.text, tokens),
    [config.highlightForeground, tokens],
  )
  const segments = useMemo(
    () => segmentText(resolvedText, highlightTerms, config.caseSensitive === true),
    [resolvedText, highlightTerms, config.caseSensitive],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <Text style={baseTextStyle} accessibilityRole="text" accessibilityLabel={resolvedText}>
        {segments.map((segment, index) =>
          segment.highlighted ? (
            <Text
              key={index}
              style={[
                baseTextStyle,
                {
                  backgroundColor: highlightBg,
                  color: highlightFg,
                },
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
    </ComponentWrapper>
  )
}
