import React from 'react'
import {
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export interface CardBaseProps {
  /** Card title text. */
  title?: string
  /** Card subtitle (rendered under title). */
  subtitle?: string
  /** Padding token (xs/sm/md/lg/xl) or numeric pixels. */
  padding?: string | number
  /** Vertical gap between content children. */
  gap?: string | number
  /** Border-radius token (sm/md/lg/...) or numeric pixels. */
  borderRadius?: string | number
  /** Shadow token (none/sm/md/lg). */
  shadow?: string
  /** Press handler — wraps the body in a TouchableOpacity when provided. */
  onPress?: (event: GestureResponderEvent) => void
  /** Style applied to root. */
  style?: ViewStyle
  /** Slot overrides (root, header, title, subtitle, content, item). */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  children?: React.ReactNode
}

/**
 * Standalone Card — plain React props, no manifest required.
 *
 * @example
 * <CardBase title="Hello" subtitle="World" onPress={() => alert('!')}>
 *   <Text>Body</Text>
 * </CardBase>
 */
export function CardBase({
  title,
  subtitle,
  padding,
  gap,
  borderRadius,
  shadow,
  onPress,
  style,
  slots,
  testID,
  children,
}: CardBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const paddingValue =
    padding === undefined
      ? tokens.spacing[4]
      : typeof padding === 'string'
        ? (tokens.spacing[padding as unknown as keyof typeof tokens.spacing] ?? tokens.spacing[4])
        : padding
  const radiusValue =
    borderRadius === undefined
      ? tokens.radius.lg
      : typeof borderRadius === 'string'
        ? (tokens.radius[borderRadius as keyof typeof tokens.radius] ?? tokens.radius.lg)
        : borderRadius
  const shadowValue =
    shadow === undefined
      ? tokens.shadows.md
      : (tokens.shadows[shadow as keyof typeof tokens.shadows] ?? tokens.shadows.md)
  const contentGap =
    gap !== undefined
      ? typeof gap === 'string'
        ? (tokens.spacing[gap as unknown as keyof typeof tokens.spacing] ?? gap)
        : gap
      : undefined

  const headerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      marginBottom: children != null ? tokens.spacing[3] : 0,
    },
    componentSurface: slots?.header,
  })
  const titleSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.title })
  const subtitleSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.subtitle })
  const contentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: '100%',
      ...(contentGap !== undefined ? { gap: contentGap } : {}),
    },
    componentSurface: slots?.content,
  })
  const itemSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.item })
  const items = React.Children.toArray(children)

  const titleStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeLg,
    color: tokens.colors.text,
    fontWeight: tokens.typography.fontWeightSemibold,
  }
  const subtitleStyle: TextStyle = {
    fontSize: tokens.typography.fontSizeSm,
    color: tokens.colors.textMuted,
    fontWeight: tokens.typography.fontWeightRegular,
    marginTop: tokens.spacing[1],
  }

  const body = (
    <>
      {title || subtitle ? (
        <View style={headerSurface.style as ViewStyle | undefined}>
          {title ? (
            <Text style={[titleStyle, titleSurface.style as TextStyle | undefined]}>{title}</Text>
          ) : null}
          {subtitle ? (
            <Text style={[subtitleStyle, subtitleSurface.style as TextStyle | undefined]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
      {items.length > 0 ? (
        <View style={contentSurface.style as ViewStyle | undefined}>
          {items.map((child, index) => (
            <View
              key={React.isValidElement(child) && child.key != null ? child.key : index}
              style={itemSurface.style as ViewStyle | undefined}
            >
              {child}
            </View>
          ))}
        </View>
      ) : null}
    </>
  )

  const rootStyle: ViewStyle = {
    backgroundColor: tokens.colors.surface,
    borderRadius: radiusValue as number,
    padding: paddingValue as number,
    ...(shadowValue as ViewStyle),
    ...style,
  }

  return (
    <View style={rootStyle} testID={testID}>
      {onPress ? (
        <TouchableOpacity
          style={{ width: '100%' }}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={title || 'Card'}
          activeOpacity={0.7}
        >
          {body}
        </TouchableOpacity>
      ) : (
        body
      )}
    </View>
  )
}
