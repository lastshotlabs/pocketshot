import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'
import type { SpacerConfig } from './types'

export function Spacer({ config }: { config: SpacerConfig }) {
  const tokens = useTokens()
  const styles = makeStyles(tokens, config)

  return <View style={styles.spacer} />
}

function makeStyles(tokens: DesignTokens, config: SpacerConfig) {
  const spacing = tokens.spacing

  if (config.flex) {
    return StyleSheet.create({
      spacer: { flex: 1 },
    })
  }

  const size = spacing[config.size as keyof typeof spacing] ?? config.size ?? 0

  return StyleSheet.create({
    spacer: { width: size, height: size },
  })
}
