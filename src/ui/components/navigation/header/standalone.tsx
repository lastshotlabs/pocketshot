import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

function useTopInset(): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useSafeAreaInsets } =
      require('react-native-safe-area-context') as typeof import('react-native-safe-area-context')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSafeAreaInsets().top
  } catch {
    return 44
  }
}

function makeStyles(tokens: DesignTokens, topInset: number) {
  return StyleSheet.create({
    wrapper: {
      backgroundColor: tokens.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.colors.border,
      paddingTop: topInset,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      minHeight: 48,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 80,
      gap: tokens.spacing[2],
    },
    center: { flex: 1, alignItems: 'center' },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      minWidth: 80,
      gap: tokens.spacing[1],
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[1],
      paddingVertical: tokens.spacing[1],
    },
    backIcon: { fontSize: tokens.typography.fontSizeLg, color: tokens.colors.primary },
    iconButton: {
      padding: tokens.spacing[2],
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: { fontSize: tokens.typography.fontSizeLg, color: tokens.colors.primary },
    title: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      textAlign: 'center',
      marginTop: 1,
    },
  })
}

export interface HeaderActionItem {
  icon: string
  label: string
  onPress: () => void
}

export interface HeaderBaseProps {
  title: string
  subtitle?: string
  /** Show built-in back arrow. */
  showBack?: boolean
  /** Called when back arrow pressed. */
  onBackPress?: () => void
  /** Optional left action button (rendered after back arrow). */
  leftAction?: HeaderActionItem
  /** Right action buttons. */
  rightActions?: HeaderActionItem[]
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone Header — plain React props, no manifest required.
 *
 * @example
 * <HeaderBase title="Settings" showBack onBackPress={() => navigation.goBack()} />
 */
export function HeaderBase({
  title,
  subtitle,
  showBack,
  onBackPress,
  leftAction,
  rightActions = [],
  style,
  testID,
  id,
}: HeaderBaseProps) {
  const tokens = useTokens()
  const topInset = useTopInset()
  const styles = makeStyles(tokens, topInset)
  const idPrefix = testID ?? id ?? 'header'

  return (
    <View style={[styles.wrapper, style]} accessibilityRole="header" testID={testID ?? id}>
      <View style={styles.row}>
        <View style={styles.left}>
          {showBack && (
            <TouchableOpacity
              onPress={onBackPress}
              style={styles.backButton}
              accessibilityLabel="Back"
              accessibilityRole="button"
              testID={`${idPrefix}-back`}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          )}
          {leftAction != null && (
            <TouchableOpacity
              onPress={leftAction.onPress}
              style={styles.iconButton}
              accessibilityLabel={leftAction.label}
              accessibilityRole="button"
              testID={`${idPrefix}-left-action`}
            >
              <Text style={styles.iconText}>{leftAction.icon}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.center}>
          <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
          {subtitle != null && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <View style={styles.right}>
          {rightActions.map((ra, index) => (
            <TouchableOpacity
              key={index}
              onPress={ra.onPress}
              style={styles.iconButton}
              accessibilityLabel={ra.label}
              accessibilityRole="button"
              testID={`${idPrefix}-right-action-${index}`}
            >
              <Text style={styles.iconText}>{ra.icon}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  )
}
