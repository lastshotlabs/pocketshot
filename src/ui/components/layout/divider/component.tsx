import React from 'react'
import { View, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'
import type { DividerConfig } from './types'

export function Divider({ config }: { config: DividerConfig }) {
  const tokens = useTokens()
  const styles = makeStyles(tokens, config)

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={styles.divider} accessibilityRole="none" />
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, config: DividerConfig) {
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const color = typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : tokens.colors.divider
  const isVertical = config.orientation === 'vertical'

  return StyleSheet.create({
    divider: {
      backgroundColor: color,
      ...(isVertical
        ? {
            width: config.thickness,
            alignSelf: 'stretch',
          }
        : {
            height: config.thickness,
            alignSelf: 'stretch',
          }),
    },
  })
}
