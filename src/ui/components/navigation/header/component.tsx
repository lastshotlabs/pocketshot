import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { Action } from '../../../actions/types'
import type { HeaderConfig } from './types'

// ── Safe area ──────────────────────────────────────────────────────────────────

function useTopInset(): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useSafeAreaInsets } =
      require('react-native-safe-area-context') as typeof import('react-native-safe-area-context')
    // This hook is called conditionally — acceptable here since the require
    // either always resolves or always throws per device environment.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSafeAreaInsets().top
  } catch {
    return 44 // Fallback for devices without safe area context
  }
}

// ── Styles ─────────────────────────────────────────────────────────────────────

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
    center: {
      flex: 1,
      alignItems: 'center',
    },
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
    backIcon: {
      fontSize: tokens.typography.fontSizeLg,
      color: tokens.colors.primary,
    },
    iconButton: {
      padding: tokens.spacing[2],
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: {
      fontSize: tokens.typography.fontSizeLg,
      color: tokens.colors.primary,
    },
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

// ── Sub-components ─────────────────────────────────────────────────────────────

interface IconButtonProps {
  icon: string
  label: string
  action: Action
  testID?: string
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  dispatch: (action: Action) => Promise<void>
}

function IconButton({ icon, label, action, testID, styles, dispatch }: IconButtonProps) {
  return (
    <TouchableOpacity
      onPress={() => void dispatch(action)}
      style={styles.iconButton}
      accessibilityLabel={label}
      accessibilityRole="button"
      testID={testID}
    >
      <Text style={styles.iconText}>{icon}</Text>
    </TouchableOpacity>
  )
}

// ── Public component ───────────────────────────────────────────────────────────

/**
 * Config-driven screen header. Handles safe area top inset automatically.
 *
 * Left area: back arrow (if showBack) + leftAction icon
 * Center: title + optional subtitle
 * Right area: up to 2 rightActions
 */
export function Header({ config }: { config: HeaderConfig }) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()
  const topInset = useTopInset()

  const styles = makeStyles(tokens, topInset)

  const rightActionList = config.rightActions ?? (config.rightAction ? [config.rightAction] : [])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={styles.wrapper} accessibilityRole="header">
        <View style={styles.row}>
          {/* Left */}
          <View style={styles.left}>
            {config.showBack && (
              <TouchableOpacity
                onPress={() => void dispatch({ type: 'navigate', to: '..' })}
                style={styles.backButton}
                accessibilityLabel="Back"
                accessibilityRole="button"
                testID={config.testID ? `${config.testID}-back` : `${config.id ?? 'header'}-back`}
              >
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
            )}
            {config.leftAction != null && (
              <IconButton
                icon={config.leftAction.icon}
                label={config.leftAction.label}
                action={config.leftAction.action}
                testID={
                  config.testID
                    ? `${config.testID}-left-action`
                    : `${config.id ?? 'header'}-left-action`
                }
                tokens={tokens}
                styles={styles}
                dispatch={dispatch}
              />
            )}
          </View>

          {/* Center */}
          <View style={styles.center}>
            <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
              {config.title}
            </Text>
            {config.subtitle != null && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {config.subtitle}
              </Text>
            )}
          </View>

          {/* Right */}
          <View style={styles.right}>
            {rightActionList.map((ra, index) => (
              <IconButton
                key={index}
                icon={ra.icon}
                label={ra.label}
                action={ra.action}
                testID={
                  config.testID
                    ? `${config.testID}-right-action-${index}`
                    : `${config.id ?? 'header'}-right-action-${index}`
                }
                tokens={tokens}
                styles={styles}
                dispatch={dispatch}
              />
            ))}
          </View>
        </View>
      </View>
    </ComponentWrapper>
  )
}

