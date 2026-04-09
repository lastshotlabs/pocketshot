import React, { useMemo } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { CardConfig } from './types'

export function Card({ config, children }: { config: CardConfig; children?: React.ReactNode }) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()
  const shadow = config.shadow ?? 'md'
  const padding = config.padding ?? 4
  const radius = config.radius ?? 'lg'
  const backgroundColor = config.backgroundColor
  const styles = useMemo(
    () => makeStyles(tokens, shadow, padding, radius, backgroundColor),
    [tokens, shadow, padding, radius, backgroundColor],
  )

  const containerStyle = [styles.card]

  if (config.onPress) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID}>
        <TouchableOpacity
          style={containerStyle}
          onPress={() => void dispatch(config.onPress!)}
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

function makeStyles(
  tokens: DesignTokens,
  shadow: NonNullable<CardConfig['shadow']>,
  padding: number,
  radius: NonNullable<CardConfig['radius']>,
  backgroundColor?: string,
) {
  const spacing = tokens.spacing
  const shadowVal = tokens.shadows[shadow]
  const paddingValue = spacing[padding as keyof typeof spacing] ?? padding

  return StyleSheet.create({
    card: {
      backgroundColor: backgroundColor ?? tokens.colors.surface,
      borderRadius: tokens.radius[radius],
      padding: paddingValue,
      ...shadowVal,
    },
  })
}
