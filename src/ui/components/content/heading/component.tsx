import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { HeadingConfig } from './types'

const FONT_SIZE_MAP = {
  1: 'fontSize4xl',
  2: 'fontSize3xl',
  3: 'fontSize2xl',
  4: 'fontSizeXl',
  5: 'fontSizeLg',
  6: 'fontSizeMd',
} as const

const FONT_WEIGHT_MAP = {
  1: 'fontWeightBold',
  2: 'fontWeightBold',
  3: 'fontWeightSemibold',
  4: 'fontWeightSemibold',
  5: 'fontWeightMedium',
  6: 'fontWeightMedium',
} as const

export function Heading({ config }: { config: HeadingConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const text = resolveFromRef(config.text, values) as string
  const styles = makeStyles(tokens, config)

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <Text
        style={styles.heading}
        accessibilityRole="header"
        testID={config.testID ?? config.id}
      >
        {text}
      </Text>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, config: HeadingConfig) {
  const level = config.level
  const fontSizeKey = FONT_SIZE_MAP[level]
  const fontWeightKey = FONT_WEIGHT_MAP[level]

  return StyleSheet.create({
    heading: {
      fontSize: tokens.typography[fontSizeKey],
      fontWeight: tokens.typography[fontWeightKey],
      color: (config.color ?? tokens.colors.text) as string,
      textAlign: config.align,
      lineHeight: tokens.typography[fontSizeKey] * tokens.typography.lineHeightTight,
    },
  })
}
