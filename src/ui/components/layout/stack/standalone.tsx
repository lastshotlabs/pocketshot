import React from 'react'
import { View, type ViewStyle } from 'react-native'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export interface StackBaseProps {
  /** Spacing between children. Token name (sm/md/lg) or numeric pixels. */
  gap?: string | number
  /** Cross-axis alignment. */
  alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  /** Main-axis alignment. */
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  /** Style applied to each child wrapper. */
  itemStyle?: ViewStyle
  /** Style applied to the root container. */
  style?: ViewStyle
  /** Slot overrides (root, item). */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  children?: React.ReactNode
}

const ALIGN_MAP: Record<NonNullable<StackBaseProps['alignItems']>, ViewStyle['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
}

const JUSTIFY_MAP: Record<NonNullable<StackBaseProps['justifyContent']>, ViewStyle['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
}

/**
 * Standalone vertical Stack — plain React props, no manifest required.
 *
 * @example
 * <StackBase gap="md" alignItems="stretch">
 *   <Text>One</Text>
 *   <Text>Two</Text>
 * </StackBase>
 */
export function StackBase({
  gap,
  alignItems = 'stretch',
  justifyContent = 'start',
  itemStyle,
  style,
  slots,
  testID,
  children,
}: StackBaseProps) {
  const tokens = useTokens()
  const itemSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.item,
  })
  const items = React.Children.toArray(children)

  const resolvedGap =
    typeof gap === 'string'
      ? (tokens.spacing[gap as unknown as keyof typeof tokens.spacing] ?? gap)
      : gap

  const containerStyle: ViewStyle = {
    flexDirection: 'column',
    alignItems: ALIGN_MAP[alignItems],
    justifyContent: JUSTIFY_MAP[justifyContent],
    ...(resolvedGap !== undefined ? { gap: resolvedGap as number } : {}),
    ...style,
  }

  return (
    <View style={containerStyle} testID={testID}>
      {items.map((child, index) => (
        <View
          key={React.isValidElement(child) && child.key != null ? child.key : index}
          style={[itemSurface.style as ViewStyle | undefined, itemStyle]}
        >
          {child}
        </View>
      ))}
    </View>
  )
}
