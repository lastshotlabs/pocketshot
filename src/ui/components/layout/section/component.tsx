import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
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

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.container}>
        {config.title !== undefined && (
          <Text style={styles.title} accessibilityRole="header">
            {config.title}
          </Text>
        )}
        {config.description !== undefined && (
          <Text style={styles.description}>{config.description}</Text>
        )}
        {children !== undefined && <View style={styles.content}>{children}</View>}
      </View>
    </ComponentWrapper>
  )
}

function titleFontSize(
  size: SectionConfig['titleSize'],
  tokens: DesignTokens,
): number {
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
  const spacing = tokens.spacing
  const paddingValue =
    spacing[config.padding as keyof typeof spacing] ?? (config.padding as number)

  return StyleSheet.create({
    container: {
      padding: paddingValue,
    },
    title: {
      fontSize: titleFontSize(config.titleSize, tokens),
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      marginBottom: spacing[1],
    },
    description: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      marginBottom: spacing[2],
    },
    content: {
      flex: 1,
    },
  })
}
