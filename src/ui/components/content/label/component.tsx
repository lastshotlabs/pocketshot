import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { LabelConfig } from './types'

const FONT_SIZE_MAP = {
  xs: 'fontSizeXs',
  sm: 'fontSizeSm',
  md: 'fontSizeMd',
} as const

export function Label({ config }: { config: LabelConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const text = resolveFromRef(config.text, values) as string
  const styles = makeStyles(tokens, config)

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <Text
        style={styles.label}
        accessibilityRole="text"
        testID={config.testID ?? config.id}
      >
        {config.uppercase ? text.toUpperCase() : text}
      </Text>
    </ComponentWrapper>
  )
}

function resolveColor(tokens: DesignTokens, variant: LabelConfig['variant']): string {
  switch (variant) {
    case 'muted':
      return tokens.colors.textMuted
    case 'error':
      return tokens.colors.error
    case 'success':
      return tokens.colors.success
    default:
      return tokens.colors.text
  }
}

function makeStyles(tokens: DesignTokens, config: LabelConfig) {
  const fontSizeKey = FONT_SIZE_MAP[config.size]

  return StyleSheet.create({
    label: {
      fontSize: tokens.typography[fontSizeKey],
      fontWeight: tokens.typography.fontWeightMedium,
      color: resolveColor(tokens, config.variant),
      letterSpacing: config.uppercase ? 0.5 : 0,
    },
  })
}
