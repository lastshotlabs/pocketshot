import React from 'react'
import { View, type ViewStyle } from 'react-native'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export interface RowBaseProps {
  /** Spacing between children. Token name (sm/md/lg) or numeric pixels. */
  gap?: string | number
  /** Cross-axis alignment. */
  alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  /** Main-axis alignment. */
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  /** Wrap behavior when children overflow. */
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  /** Style applied to each child wrapper. */
  itemStyle?: ViewStyle
  /** Style applied to the root container. */
  style?: ViewStyle
  /** Slot overrides (root, item). */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  children?: React.ReactNode
}

const ALIGN_MAP: Record<NonNullable<RowBaseProps['alignItems']>, ViewStyle['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
}

const JUSTIFY_MAP: Record<
  NonNullable<RowBaseProps['justifyContent']>,
  ViewStyle['justifyContent']
> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
}

/**
 * Standalone horizontal Row — plain React props, no manifest required.
 *
 * @example
 * <RowBase gap="sm" alignItems="center">
 *   <Icon name="user" />
 *   <Text>Hi</Text>
 * </RowBase>
 */
export function RowBase({
  gap,
  alignItems = 'stretch',
  justifyContent = 'start',
  flexWrap = 'nowrap',
  itemStyle,
  style,
  slots,
  testID,
  children,
}: RowBaseProps) {
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
    flexDirection: 'row',
    alignItems: ALIGN_MAP[alignItems],
    justifyContent: JUSTIFY_MAP[justifyContent],
    flexWrap,
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
