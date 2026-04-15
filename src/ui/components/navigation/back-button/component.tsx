import React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { BackButtonConfig } from './types'

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[1],
      paddingVertical: tokens.spacing[2],
      paddingHorizontal: tokens.spacing[2],
      alignSelf: 'flex-start',
    },
    arrow: {
      fontSize: tokens.typography.fontSizeLg,
      color: tokens.colors.primary,
      lineHeight: tokens.typography.fontSizeLg * 1.3,
    },
    label: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.primary,
    },
  })
}

/**
 * Config-driven back button. Dispatches `config.action` if provided,
 * otherwise navigates back via `{ type: 'navigate', to: '..' }`.
 */
export function BackButton({ config }: { config: BackButtonConfig }) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()

  const styles = makeStyles(tokens)

  function handlePress() {
    const action = config.action ?? { type: 'navigate' as const, to: '..' }
    void dispatch(action)
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <TouchableOpacity
        onPress={handlePress}
        style={styles.button}
        accessibilityLabel={config.label}
        accessibilityRole="button"
        accessibilityHint="Navigate to the previous screen"
        testID={config.testID ?? config.id ?? 'back-button'}
      >
        <Text style={styles.arrow} accessibilityElementsHidden>
          ←
        </Text>
        <Text style={styles.label}>{config.label}</Text>
      </TouchableOpacity>
    </ComponentWrapper>
  )
}
