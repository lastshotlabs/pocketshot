import React, { useMemo } from 'react'
import { Text } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { HighlightedTextConfig } from './types'

interface Segment {
  text: string
  highlighted: boolean
}

function segmentText(text: string, highlights: string[]): Segment[] {
  if (!highlights.length || !text) {
    return [{ text, highlighted: false }]
  }

  // Build a single regex from all highlight terms, case-insensitive
  const escaped = highlights
    .filter((h) => h.length > 0)
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

  if (!escaped.length) {
    return [{ text, highlighted: false }]
  }

  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = text.split(pattern)

  const highlightSet = new Set(highlights.map((h) => h.toLowerCase()))

  return parts
    .filter((p) => p.length > 0)
    .map((part) => ({
      text: part,
      highlighted: highlightSet.has(part.toLowerCase()),
    }))
}

function resolveColor(
  colorKey: string | undefined,
  fallback: string,
  tokens: DesignTokens,
): string {
  if (!colorKey) return fallback
  // Allow token color key lookup (e.g. 'warning', 'primary') or raw hex
  const tokenColor = (tokens.colors as unknown as Record<string, string>)[colorKey]
  return tokenColor ?? colorKey
}

export function HighlightedText({ config }: { config: HighlightedTextConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const resolvedText = isFromRef(config.text)
    ? String(resolveFromRef(config.text, values) ?? '')
    : config.text

  const resolvedHighlights: string[] = isFromRef(config.highlights)
    ? ((resolveFromRef(config.highlights, values) as unknown as string[]) ?? [])
    : (config.highlights as string[]) ?? []
  const baseTextStyle = useMemo(() => {
    const resolved = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
    const fontSize =
      typeof resolved.fontSize === 'number' ? resolved.fontSize : tokens.typography.fontSizeMd

    return {
      color: tokens.colors.text,
      fontSize,
      lineHeight: fontSize * tokens.typography.lineHeightNormal,
      ...resolved,
    }
  }, [config, tokens])

  const highlightBg = useMemo(
    () => resolveColor(config.highlightColor, tokens.colors.warning, tokens),
    [config.highlightColor, tokens],
  )

  const highlightFg = useMemo(
    () => resolveColor(config.highlightForeground, tokens.colors.text, tokens),
    [config.highlightForeground, tokens],
  )

  const segments = useMemo(
    () => segmentText(resolvedText, resolvedHighlights),
    [resolvedText, resolvedHighlights],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <Text
        style={baseTextStyle}
        accessibilityRole="text"
        accessibilityLabel={resolvedText}
      >
        {segments.map((segment, index) =>
          segment.highlighted ? (
            <Text
              key={index}
              style={{
                ...baseTextStyle,
                backgroundColor: highlightBg,
                color: highlightFg,
              }}
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

