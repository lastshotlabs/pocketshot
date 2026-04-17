import type { TextStyle } from 'react-native'
import type { DesignTokens } from '../../tokens/types'
import { resolveNativeStyleProps } from './style-props'

const TEXT_STYLE_KEYS = [
  'backgroundColor',
  'color',
  'textAlign',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'fontStyle',
  'textDecorationLine',
  'textTransform',
  'opacity',
] as const

export function resolveNativeTextStyle(
  config: Record<string, unknown>,
  tokens: DesignTokens,
): TextStyle {
  const resolved = resolveNativeStyleProps(config, tokens)
  const textStyle: Record<string, unknown> = {}

  for (const key of TEXT_STYLE_KEYS) {
    if (resolved[key] != null) {
      textStyle[key] = resolved[key]
    }
  }

  return textStyle as TextStyle
}
