import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'
import type { DividerConfig } from './types'

export function Divider({ config }: { config: DividerConfig }) {
  const tokens = useTokens()
  const styles = makeStyles(tokens, config)

  return <View style={styles.divider} accessibilityRole="none" />
}

function makeStyles(tokens: DesignTokens, config: DividerConfig) {
  const spacing = tokens.spacing
  const color = config.color ?? tokens.colors.divider
  const marginV =
    spacing[config.marginVertical as keyof typeof spacing] ?? config.marginVertical ?? 0
  const isVertical = config.orientation === 'vertical'

  return StyleSheet.create({
    divider: {
      backgroundColor: color,
      ...(isVertical
        ? {
            width: config.thickness,
            alignSelf: 'stretch',
            marginHorizontal: marginV,
          }
        : {
            height: config.thickness,
            alignSelf: 'stretch',
            marginVertical: marginV,
          }),
    },
  })
}
