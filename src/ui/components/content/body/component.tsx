import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { BodyConfig } from './types'

const FONT_SIZE_MAP = {
  sm: 'fontSizeSm',
  md: 'fontSizeMd',
  lg: 'fontSizeLg',
} as const

const FONT_WEIGHT_MAP = {
  regular: 'fontWeightRegular',
  medium: 'fontWeightMedium',
  semibold: 'fontWeightSemibold',
  bold: 'fontWeightBold',
} as const

export function Body({ config }: { config: BodyConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const text = resolveFromRef(config.text, values) as string
  const styles = makeStyles(tokens, config)

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <Text
        style={styles.body}
        numberOfLines={config.numberOfLines}
        accessibilityRole="text"
        testID={config.testID ?? config.id}
      >
        {text}
      </Text>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, config: BodyConfig) {
  const fontSizeKey = FONT_SIZE_MAP[config.size ?? 'md']
  const fontWeightKey = FONT_WEIGHT_MAP[config.weight ?? 'regular']

  return StyleSheet.create({
    body: {
      fontSize: tokens.typography[fontSizeKey],
      fontWeight: tokens.typography[fontWeightKey],
      color: (config.color ?? tokens.colors.text) as string,
      textAlign: config.align ?? 'left',
      lineHeight: tokens.typography[fontSizeKey] * tokens.typography.lineHeightNormal,
    },
  })
}
