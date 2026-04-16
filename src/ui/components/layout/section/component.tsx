import React from 'react'
import { View, Text, StyleSheet, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'
import type { SectionConfig } from './types'

export function Section({
  config,
  children,
}: {
  config: SectionConfig
  children?: React.ReactNode
}) {
  const tokens = useTokens()
  const styles = makeStyles(tokens, config)
  const itemSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.item as Record<string, unknown> | undefined,
  })
  const items = React.Children.toArray(children)

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      style={styles.container}
    >
      {config.title !== undefined && (
        <Text style={styles.title} accessibilityRole="header">
          {config.title}
        </Text>
      )}
      {config.description !== undefined && (
        <Text style={styles.description}>{config.description}</Text>
      )}
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
    </ComponentWrapper>
  )
}

function titleFontSize(size: SectionConfig['titleSize'], tokens: DesignTokens): number {
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

function makeStyles(tokens: DesignTokens, config: SectionConfig) {
  return StyleSheet.create({
    container: {},
    title: {
      fontSize: titleFontSize(config.titleSize, tokens),
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    },
    description: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      marginBottom: tokens.spacing[2],
    },
    content: {
      flex: 1,
    },
  })
}

