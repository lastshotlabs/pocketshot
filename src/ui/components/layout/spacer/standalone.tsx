import React from 'react'
import { View, type ViewStyle } from 'react-native'
import { useTokens } from '../../../context/AppContext'

export interface SpacerBaseProps {
  /** Pixel size, or a spacing token key. Ignored when `flex` is true. */
  size?: number | string
  /** When true, fills available space (`flex: 1`). */
  flex?: boolean
  /** Style applied to the root View. */
  style?: ViewStyle
  /** Slot overrides (root). */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone Spacer — plain React props, no manifest required.
 *
 * @example
 * <SpacerBase size={16} />
 * <SpacerBase flex />
 */
export function SpacerBase({ size = 4, flex = false, style, testID, id }: SpacerBaseProps) {
  const tokens = useTokens()

  if (flex) {
    return <View style={[{ flex: 1 }, style]} testID={testID ?? id} />
  }

  const resolvedSize =
    typeof size === 'string'
      ? (tokens.spacing[size as unknown as keyof typeof tokens.spacing] ?? size)
      : size

  return (
    <View
      style={[{ width: resolvedSize as number, height: resolvedSize as number }, style]}
      testID={testID ?? id}
    />
  )
}
