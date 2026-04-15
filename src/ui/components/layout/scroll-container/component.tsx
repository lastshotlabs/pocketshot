import React, { useState, useCallback } from 'react'
import { ScrollView, RefreshControl, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { ScrollContainerConfig } from './types'

// Safe area insets — gracefully degrade if the package is not installed.
let useSafeAreaInsets: (() => { bottom: number; top: number; left: number; right: number }) | null =
  null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const safeArea = require('react-native-safe-area-context') as {
    useSafeAreaInsets: () => { bottom: number; top: number; left: number; right: number }
  }
  useSafeAreaInsets = safeArea.useSafeAreaInsets
} catch {
  // react-native-safe-area-context not installed — insets default to 0
}

function useSafeBottom(): number {
  if (useSafeAreaInsets) {
    // React rules require hooks to be called unconditionally, but since this
    // module-level reference is set once at import time, the call count is
    // stable across renders.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSafeAreaInsets().bottom
  }
  return 0
}

export function ScrollContainer({
  config,
  children,
}: {
  config: ScrollContainerConfig
  children?: React.ReactNode
}) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()
  const safeBottom = useSafeBottom()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (!config.onRefresh) return
    setRefreshing(true)
    try {
      await dispatch(config.onRefresh)
    } finally {
      setRefreshing(false)
    }
  }, [config.onRefresh, dispatch])

  const styles = makeStyles(tokens, config, safeBottom)

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        horizontal={config.horizontal}
        showsHorizontalScrollIndicator={config.horizontal ? config.showsScrollIndicator : false}
        showsVerticalScrollIndicator={config.horizontal ? false : config.showsScrollIndicator}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          config.refreshable ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={tokens.colors.primary}
              colors={[tokens.colors.primary]}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, config: ScrollContainerConfig, safeBottom: number) {
  const spacing = tokens.spacing

  const contentPaddingValue =
    config.contentPadding !== undefined
      ? (spacing[config.contentPadding as keyof typeof spacing] ?? config.contentPadding)
      : undefined

  return StyleSheet.create({
    scroll: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      paddingBottom: safeBottom,
      ...(contentPaddingValue !== undefined && { padding: contentPaddingValue }),
    },
  })
}

