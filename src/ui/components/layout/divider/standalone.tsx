import React from 'react'
import { View, type ViewStyle } from 'react-native'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export interface DividerBaseProps {
  /** Line thickness in pixels. */
  thickness?: number
  /** Divider orientation. */
  orientation?: 'horizontal' | 'vertical'
  /** Override the line color. Token name or color value. */
  color?: string
  /** Style applied to the line View. */
  style?: ViewStyle
  /** Slot overrides (root, line). */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone Divider — plain React props, no manifest required.
 *
 * @example
 * <DividerBase orientation="horizontal" thickness={1} />
 */
export function DividerBase({
  thickness = 1,
  orientation = 'horizontal',
  color,
  style,
  slots,
  testID,
  id,
}: DividerBaseProps) {
  const tokens = useTokens()
  const isVertical = orientation === 'vertical'
  const dividerColor = color ?? 'border'

  const lineSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: dividerColor,
      ...(isVertical
        ? {
            width: thickness,
            alignSelf: 'stretch',
          }
        : {
            height: thickness,
            alignSelf: 'stretch',
          }),
    },
    componentSurface: slots?.line,
  })

  return (
    <View
      style={[lineSurface.style as ViewStyle | undefined, style]}
      accessibilityRole="none"
      testID={testID ?? id}
    />
  )
}
