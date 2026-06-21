import React from 'react'
import { View, Text, StyleSheet, type TextStyle, type ViewStyle } from 'react-native'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export interface SectionBaseProps {
  /** Optional section heading. */
  title?: string
  /** Optional supporting text under the title. */
  description?: string
  /** Title size (sm/md/lg). */
  titleSize?: 'sm' | 'md' | 'lg'
  /** Style applied to the root container. */
  style?: ViewStyle
  /** Slot overrides (root, item). */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
  children?: React.ReactNode
}

/**
 * Standalone Section — plain React props, no manifest required.
 *
 * @example
 * <SectionBase title="Profile" description="Your account details">
 *   <Text>Item</Text>
 * </SectionBase>
 */
export function SectionBase({
  title,
  description,
  titleSize = 'md',
  style,
  slots,
  testID,
  id,
  children,
}: SectionBaseProps) {
  const tokens = useTokens()
  const styles = makeStyles(tokens, titleSize)
  const itemSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.item,
  })
  const items = React.Children.toArray(children)

  return (
    <View style={[styles.container, style]} testID={testID ?? id}>
      {title !== undefined && (
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      )}
      {description !== undefined && <Text style={styles.description}>{description}</Text>}
      {children !== undefined && (
        <View style={styles.content}>
          {items.map((child, index) => (
            <View
              key={React.isValidElement(child) && child.key != null ? child.key : index}
              style={itemSurface.style as ViewStyle | undefined}
            >
              {child}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

function titleFontSize(size: SectionBaseProps['titleSize'], tokens: DesignTokens): number {
  switch (size) {
    case 'sm':
      return tokens.typography.fontSizeSm
    case 'lg':
      return tokens.typography.fontSizeLg
    case 'md':
    default:
      return tokens.typography.fontSizeMd
  }
}

function makeStyles(tokens: DesignTokens, titleSize: SectionBaseProps['titleSize']) {
  return StyleSheet.create({
    container: {} as ViewStyle,
    title: {
      fontSize: titleFontSize(titleSize, tokens),
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    } as TextStyle,
    description: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      marginBottom: tokens.spacing[2],
    } as TextStyle,
    content: {
      flex: 1,
    } as ViewStyle,
  })
}
