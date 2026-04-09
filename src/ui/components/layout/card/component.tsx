import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { CardConfig } from './types'

export function Card({
  config,
  children,
}: {
  config: CardConfig
  children?: React.ReactNode
}) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()
  const styles = makeStyles(tokens, config)

  const containerStyle = [styles.card]

  if (config.onPress) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID}>
        <TouchableOpacity
          style={containerStyle}
          onPress={() => dispatch(config.onPress!)}
          accessibilityRole="button"
          accessibilityLabel="Card"
          activeOpacity={0.7}
        >
          {children}
        </TouchableOpacity>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={containerStyle}>{children}</View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, config: CardConfig) {
  const spacing = tokens.spacing
  const shadow = tokens.shadows[config.shadow]
  const paddingValue =
    spacing[config.padding as keyof typeof spacing] ?? (config.padding as number)

  return StyleSheet.create({
    card: {
      backgroundColor: config.backgroundColor ?? tokens.colors.surface,
      borderRadius: tokens.radius[config.radius],
      padding: paddingValue,
      ...shadow,
    },
  })
}
