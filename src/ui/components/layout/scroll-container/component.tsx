import React, { useState, useCallback } from 'react'
import { ScrollView, RefreshControl, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
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

  const contentPaddingValue =
    config.contentPadding !== undefined
      ? (tokens.spacing[config.contentPadding as keyof typeof tokens.spacing] ?? config.contentPadding)
      : undefined
  const rootSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
    },
    componentSurface: config.slots?.root as Record<string, unknown> | undefined,
  })
  const viewportSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexGrow: 1,
      paddingBottom: safeBottom,
      ...(contentPaddingValue !== undefined ? { padding: contentPaddingValue } : {}),
    },
    componentSurface: config.slots?.viewport as Record<string, unknown> | undefined,
  })

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ScrollView
        style={rootSurface.style as ViewStyle | undefined}
        contentContainerStyle={viewportSurface.style as ViewStyle | undefined}
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

