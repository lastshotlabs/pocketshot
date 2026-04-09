import React from 'react'
import { View, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'
import type { RowConfig } from './types'

export function Row({ config, children }: { config: RowConfig; children?: React.ReactNode }) {
  const tokens = useTokens()
  const styles = makeStyles(tokens, config)

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.container}>{children}</View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, config: RowConfig) {
  const spacing = tokens.spacing

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      columnGap: spacing[config.gap as keyof typeof spacing] ?? config.gap ?? 0,
      alignItems: config.align,
      justifyContent: config.justify,
      flexWrap: config.wrap ? 'wrap' : 'nowrap',
      ...(config.padding !== undefined && {
        padding: spacing[config.padding as keyof typeof spacing] ?? config.padding,
      }),
      ...(config.paddingHorizontal !== undefined && {
        paddingHorizontal:
          spacing[config.paddingHorizontal as keyof typeof spacing] ?? config.paddingHorizontal,
      }),
      ...(config.paddingVertical !== undefined && {
        paddingVertical:
          spacing[config.paddingVertical as keyof typeof spacing] ?? config.paddingVertical,
      }),
      ...(config.backgroundColor !== undefined && {
        backgroundColor: config.backgroundColor,
      }),
    },
  })
}
