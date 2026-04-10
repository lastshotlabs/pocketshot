import React, { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'
import type { ScreenConfig } from './types'

// ── Safe area ──────────────────────────────────────────────────────────────────

type Edge = 'top' | 'bottom' | 'left' | 'right'

function useSafeAreaEdges(edges: Edge[]): {
  top: number
  bottom: number
  left: number
  right: number
} {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useSafeAreaInsets } =
      require('react-native-safe-area-context') as typeof import('react-native-safe-area-context')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const insets = useSafeAreaInsets()
    return {
      top: edges.includes('top') ? insets.top : 0,
      bottom: edges.includes('bottom') ? insets.bottom : 0,
      left: edges.includes('left') ? insets.left : 0,
      right: edges.includes('right') ? insets.right : 0,
    }
  } catch {
    return {
      top: edges.includes('top') ? 44 : 0,
      bottom: edges.includes('bottom') ? 34 : 0,
      left: 0,
      right: 0,
    }
  }
}

// ── Styles ─────────────────────────────────────────────────────────────────────

function makeStyles(
  tokens: DesignTokens,
  config: ScreenConfig,
  insets: { top: number; bottom: number; left: number; right: number },
) {
  const backgroundColor =
    config.background ?? tokens.colors.background
  const padding = config.padding ?? tokens.spacing[4]

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    content: {
      flex: 1,
      padding,
    },
    scrollContent: {
      flexGrow: 1,
      padding,
    },
  })
}

// ── Public component ───────────────────────────────────────────────────────────

/**
 * Config-driven safe-area-aware screen wrapper. Wraps children in SafeAreaView
 * with configurable edges, and optionally in a ScrollView when scrollable is true.
 */
export function Screen({
  config,
  children,
}: {
  config: ScreenConfig
  children?: React.ReactNode
}) {
  const tokens = useTokens()
  const edges = config.edges ?? ['top', 'bottom', 'left', 'right']
  const scrollable = config.scrollable ?? true
  const insets = useSafeAreaEdges(edges)

  const styles = useMemo(
    () => makeStyles(tokens, config, insets),
    [tokens, config, insets],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View
        style={styles.container}
        testID={config.testID ? `${config.testID}-safe-area` : `${config.id ?? 'screen'}-safe-area`}
        accessibilityRole="none"
      >
        {scrollable ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            testID={
              config.testID
                ? `${config.testID}-scroll`
                : `${config.id ?? 'screen'}-scroll`
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={styles.content}>{children}</View>
        )}
      </View>
    </ComponentWrapper>
  )
}
