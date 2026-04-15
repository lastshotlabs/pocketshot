import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { AlertConfig } from './types'

type Variant = NonNullable<AlertConfig['variant']>

const DEFAULT_ICONS: Record<Variant, string> = {
  success: '✓',
  warning: '⚠',
  error: '✕',
  info: 'ℹ',
  default: '•',
}

function resolveVariantColors(
  variant: Variant,
  tokens: DesignTokens,
): { accentColor: string; backgroundColor: string; textColor: string; bodyColor: string } {
  switch (variant) {
    case 'success':
      return {
        accentColor: tokens.colors.success,
        backgroundColor: tokens.colors.success + '1A',
        textColor: tokens.colors.success,
        bodyColor: tokens.colors.textMuted,
      }
    case 'warning':
      return {
        accentColor: tokens.colors.warning,
        backgroundColor: tokens.colors.warning + '1A',
        textColor: tokens.colors.warning,
        bodyColor: tokens.colors.textMuted,
      }
    case 'error':
      return {
        accentColor: tokens.colors.error,
        backgroundColor: tokens.colors.error + '1A',
        textColor: tokens.colors.error,
        bodyColor: tokens.colors.textMuted,
      }
    case 'info':
      return {
        accentColor: tokens.colors.info,
        backgroundColor: tokens.colors.info + '1A',
        textColor: tokens.colors.info,
        bodyColor: tokens.colors.textMuted,
      }
    case 'default':
    default:
      return {
        accentColor: tokens.colors.border,
        backgroundColor: tokens.colors.surfaceAlt,
        textColor: tokens.colors.text,
        bodyColor: tokens.colors.textMuted,
      }
  }
}

function makeStyles(tokens: DesignTokens, variantColors: ReturnType<typeof resolveVariantColors>) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      borderRadius: tokens.radius.md,
      backgroundColor: variantColors.backgroundColor,
      overflow: 'hidden',
    },
    accent: {
      width: 4,
      backgroundColor: variantColors.accentColor,
    },
    content: {
      flex: 1,
      padding: tokens.spacing[3],
      paddingLeft: tokens.spacing[3],
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    icon: {
      fontSize: tokens.typography.fontSizeSm,
      color: variantColors.accentColor,
      marginRight: tokens.spacing[2],
      lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
    },
    titleRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      flex: 1,
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: variantColors.textColor,
      lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
    },
    dismissButton: {
      marginLeft: tokens.spacing[2],
      padding: tokens.spacing[1],
    },
    dismissText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
    },
    body: {
      fontSize: tokens.typography.fontSizeSm,
      color: variantColors.bodyColor,
      marginTop: tokens.spacing[1],
      lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightRelaxed,
    },
    actionButton: {
      marginTop: tokens.spacing[2],
      alignSelf: 'flex-start',
    },
    actionText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: variantColors.accentColor,
    },
  })
}

export function Alert({ config }: { config: AlertConfig }) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()
  const [dismissed, setDismissed] = useState(false)

  const variant = config.variant ?? 'default'
  const variantColors = useMemo(() => resolveVariantColors(variant, tokens), [variant, tokens])
  const styles = useMemo(() => makeStyles(tokens, variantColors), [tokens, variantColors])

  const icon = config.icon ?? DEFAULT_ICONS[variant]

  const handleDismiss = useCallback(async () => {
    setDismissed(true)
    if (config.onDismiss) {
      await dispatch(config.onDismiss)
    }
  }, [config.onDismiss, dispatch])

  const handleActionPress = useCallback(async () => {
    if (!config.action) return
    await dispatch(config.action.onPress)
  }, [config.action, dispatch])

  if (dismissed) return null

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View
        style={styles.container}
        accessibilityRole="alert"
        accessibilityLabel={`${config.title}${config.body ? '. ' + config.body : ''}`}
      >
        <View style={styles.accent} />
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.icon} accessibilityElementsHidden>
              {icon}
            </Text>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{config.title}</Text>
              {config.dismissible ? (
                <TouchableOpacity
                  onPress={handleDismiss}
                  style={styles.dismissButton}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss alert"
                  testID={config.testID ? `${config.testID}-dismiss` : undefined}
                >
                  <Text style={styles.dismissText}>×</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          {config.body ? <Text style={styles.body}>{config.body}</Text> : null}
          {config.action ? (
            <TouchableOpacity
              onPress={handleActionPress}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel={config.action.label}
              testID={config.testID ? `${config.testID}-action` : undefined}
            >
              <Text style={styles.actionText}>{config.action.label}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </ComponentWrapper>
  )
}

