import React, { useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { EmptyStateConfig } from './types'

export function EmptyState({ config }: { config: EmptyStateConfig }) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()
  const styles = makeStyles(tokens)

  const handleActionPress = useCallback(async () => {
    if (!config.action?.onPress) return
    await dispatch(config.action.onPress)
  }, [config.action, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.container} accessibilityRole="none">
        {config.icon ? (
          <Text
            style={styles.icon}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {config.icon}
          </Text>
        ) : null}
        <Text style={styles.title} accessibilityRole="header">
          {config.title}
        </Text>
        {config.description ? (
          <Text style={styles.description}>{config.description}</Text>
        ) : null}
        {config.action ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleActionPress}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={config.action.label}
          >
            <Text style={styles.actionLabel}>{config.action.label}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: tokens.spacing[8],
    },
    icon: {
      fontSize: 48,
      marginBottom: tokens.spacing[4],
      textAlign: 'center',
    },
    title: {
      fontSize: tokens.typography.fontSizeLg,
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightSemibold,
      textAlign: 'center',
      marginBottom: tokens.spacing[2],
    },
    description: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.textMuted,
      textAlign: 'center',
      lineHeight: tokens.typography.fontSizeMd * tokens.typography.lineHeightNormal,
      marginBottom: tokens.spacing[6],
    },
    actionButton: {
      backgroundColor: tokens.colors.primary,
      borderRadius: tokens.radius.lg,
      paddingHorizontal: tokens.spacing[6],
      paddingVertical: tokens.spacing[3],
      marginTop: tokens.spacing[4],
    },
    actionLabel: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.primaryForeground,
      fontWeight: tokens.typography.fontWeightSemibold,
      textAlign: 'center',
    },
  })
}
