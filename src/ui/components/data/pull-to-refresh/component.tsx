import React, { useCallback, useMemo, type ReactNode } from 'react'
import { ScrollView, RefreshControl, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { PullToRefreshConfig } from './types'

// ---------------------------------------------------------------------------
// PullToRefresh
// ---------------------------------------------------------------------------

export interface PullToRefreshProps {
  config: PullToRefreshConfig
  children?: ReactNode
}

/**
 * Pull-to-refresh wrapper. Wraps children in a ScrollView with RefreshControl.
 * Uses tokens for colors and dispatches the onRefresh action on pull.
 */
export function PullToRefresh({ config, children }: PullToRefreshProps) {
  const tokens = useTokens()
  const { dispatch, values } = useScreenContext()

  const refreshing = isFromRef(config.refreshing)
    ? (resolveFromRef<boolean>(config.refreshing, values) ?? false)
    : Boolean(config.refreshing)

  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const tintColor =
    typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : tokens.colors.primary
  const scrollViewSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      minHeight: '100%',
    },
    componentSurface: config.slots?.scrollView as Record<string, unknown> | undefined,
  })
  const baseTestID = config.testID ?? config.id ?? 'pull-to-refresh'

  const handleRefresh = useCallback(async () => {
    await dispatch(config.onRefresh)
  }, [config.onRefresh, dispatch])

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        tintColor={tintColor}
        colors={[tintColor]}
        progressBackgroundColor={tokens.colors.surface}
        testID={`${baseTestID}-refresh`}
        accessibilityLabel="Pull to refresh"
      />
    ),
    [baseTestID, refreshing, handleRefresh, tintColor, tokens.colors.surface],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ScrollView
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        style={scrollViewSurface.style as ViewStyle | undefined}
        testID={`${baseTestID}-scroll`}
      >
        {children}
      </ScrollView>
    </ComponentWrapper>
  )
}

