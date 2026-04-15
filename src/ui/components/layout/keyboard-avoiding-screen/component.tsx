import React, { useMemo } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'
import type { KeyboardAvoidingScreenConfig } from './types'

// ── Platform default ───────────────────────────────────────────────────────────

const DEFAULT_BEHAVIOR = Platform.OS === 'ios' ? 'padding' : 'height'

// ── Safe area ──────────────────────────────────────────────────────────────────

function useSafeAreaInsets(): { top: number; bottom: number } {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const safeArea =
      require('react-native-safe-area-context') as typeof import('react-native-safe-area-context')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const insets = safeArea.useSafeAreaInsets()
    return { top: insets.top, bottom: insets.bottom }
  } catch {
    return { top: 44, bottom: 34 }
  }
}

// ── Styles ─────────────────────────────────────────────────────────────────────

function makeStyles(
  tokens: DesignTokens,
  insets: { top: number; bottom: number },
) {
  return StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: tokens.colors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
    keyboardAvoiding: {
      flex: 1,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
  })
}

// ── Public component ───────────────────────────────────────────────────────────

/**
 * Config-driven screen with keyboard avoidance. Wraps content in
 * KeyboardAvoidingView with platform-appropriate behavior defaults.
 *
 * Auto-detects platform: defaults to 'padding' on iOS, 'height' on Android.
 * Includes safe area insets and optional scrollability.
 */
export function KeyboardAvoidingScreen({
  config,
  children,
}: {
  config: KeyboardAvoidingScreenConfig
  children?: React.ReactNode
}) {
  const tokens = useTokens()
  const scrollable = config.scrollable ?? true
  const behavior = config.behavior ?? DEFAULT_BEHAVIOR
  const insets = useSafeAreaInsets()

  const styles = useMemo(() => makeStyles(tokens, insets), [tokens, insets])

  const idPrefix = config.testID ?? config.id ?? 'kb-screen'

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      style={styles.safeContainer}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={behavior}
        testID={`${idPrefix}-keyboard-avoiding`}
      >
        {scrollable ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            testID={`${idPrefix}-scroll`}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={styles.content}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </ComponentWrapper>
  )
}

