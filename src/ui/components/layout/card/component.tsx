import React, { useMemo } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { CardConfig } from './types'

export function Card({ config, children }: { config: CardConfig; children?: React.ReactNode }) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  if (config.onPress) {
    return (
      <ComponentWrapper
        id={config.id}
        testID={config.testID}
        config={config}
        style={styles.card}
      >
        <TouchableOpacity
          style={styles.pressable}
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
    <ComponentWrapper id={config.id} testID={config.testID} config={config} style={styles.card}>
      <View>{children}</View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: ReturnType<typeof useTokens>) {
  return StyleSheet.create({
    card: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.lg,
      padding: tokens.spacing[4],
      ...tokens.shadows.md,
    },
    pressable: {
      width: '100%',
    },
  })
}

